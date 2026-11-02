"""Call the public TRELLIS.2 demo with one character; retain auditable trial outputs."""
import argparse
import concurrent.futures
import json
from pathlib import Path
import shutil
import time

from gradio_client import Client, handle_file

parser = argparse.ArgumentParser()
parser.add_argument('--input', required=True)
parser.add_argument('--name', required=True)
parser.add_argument('--resolution', default='1024', choices=['512', '1024', '1536'])
args = parser.parse_args()
out = Path(__file__).resolve().parent / ('trellis-' + args.name)
out.mkdir(exist_ok=True)
record = {
    'service': 'microsoft/TRELLIS.2',
    'input': str(Path(args.input).resolve()),
    'parameters': {'seed': 0, 'resolution': args.resolution, 'decimation_target': 100000, 'texture_size': 2048},
    'status': 'starting',
    'stage': 'start_session',
    'acceptedForProduction': False,
}

def save():
    (out / 'trial.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')

def run(endpoint, **kwargs):
    record['stage'] = endpoint
    save()
    print('START ' + endpoint, flush=True)
    job = client.submit(api_name='/' + endpoint, **kwargs)
    previous = None
    while True:
        try:
            return job.result(timeout=15)
        except concurrent.futures.TimeoutError:
            status = job.status()
            update = (str(status.code), status.rank, status.eta)
            if update != previous:
                print(json.dumps({'stage': endpoint, 'status': update[0], 'rank': update[1], 'eta': update[2]}), flush=True)
                previous = update

try:
    save()
    client = Client('microsoft/TRELLIS.2', download_files=str(out / 'downloads'), verbose=False)
    run('start_session')
    image = run('preprocess_image', input=handle_file(args.input))
    record['preprocessedImage'] = image
    preview = run('image_to_3d', image=image, seed=0, resolution=args.resolution)
    (out / 'preview.html').write_text(preview, encoding='utf-8')
    record['status'] = 'generated'
    save()
    result = run('extract_glb', decimation_target=100000, texture_size=2048)
    record['downloadResult'] = result
    source = Path(result[0])
    target = out / (args.name + '-unrigged.glb')
    shutil.copy2(source, target)
    record.update(status='exported', model=str(target), bytes=target.stat().st_size)
    save()
    print(json.dumps({'status': 'exported', 'model': str(target), 'bytes': target.stat().st_size}), flush=True)
except Exception as error:
    record.update(status='failed', errorType=type(error).__name__, error=str(error))
    save()
    print(json.dumps({'status': 'failed', 'stage': record['stage'], 'errorType': record['errorType'], 'error': str(error)}), flush=True)
    raise SystemExit(1)
