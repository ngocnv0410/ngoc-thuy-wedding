import fs from 'node:fs'
import path from 'node:path'

const input=path.resolve(process.argv[2]),bytes=fs.readFileSync(input)
let doc,bin
for(let offset=12;offset<bytes.length;){const length=bytes.readUInt32LE(offset),type=bytes.readUInt32LE(offset+4),chunk=bytes.subarray(offset+8,offset+8+length);if(type===0x4e4f534a)doc=JSON.parse(chunk.toString('utf8'));if(type===0x004e4942)bin=chunk;offset+=8+length}
if(!doc||!bin)throw Error('Missing GLB chunks')
function accessor(index){const a=doc.accessors[index],view=doc.bufferViews[a.bufferView],start=(view.byteOffset??0)+(a.byteOffset??0),size={5121:1,5123:2,5125:4,5126:4}[a.componentType],width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],stride=view.byteStride??size*width;if(!size||!width||a.sparse)throw Error('Unsupported accessor');return{count:a.count,get(i,k=0){const p=start+i*stride+k*size;return a.componentType===5126?bin.readFloatLE(p):a.componentType===5125?bin.readUInt32LE(p):a.componentType===5123?bin.readUInt16LE(p):bin.readUInt8(p)}}}
const result=[]
for(const [mi,mesh] of doc.meshes.entries())for(const [pi,primitive]of mesh.primitives.entries()){
 if((primitive.mode??4)!==4)throw Error('Triangle mode required')
 const positions=accessor(primitive.attributes.POSITION),indices=primitive.indices===undefined?{count:positions.count,get:i=>i}:accessor(primitive.indices),parent=new Int32Array(positions.count),rank=new Uint8Array(positions.count)
 for(let i=0;i<parent.length;i++)parent[i]=i
 function root(i){while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i]}return i}
 function join(a,b){a=root(a);b=root(b);if(a===b)return;if(rank[a]<rank[b])parent[a]=b;else{parent[b]=a;if(rank[a]===rank[b])rank[a]++}}
 let degenerateIndexTriangles=0
 for(let i=0;i<indices.count;i+=3){const a=indices.get(i),b=indices.get(i+1),c=indices.get(i+2);if(a>=parent.length||b>=parent.length||c>=parent.length)throw Error('Invalid index');if(a===b||b===c||c===a)degenerateIndexTriangles++;join(a,b);join(b,c)}
 const groups=new Map()
 for(let i=0;i<positions.count;i++){const key=root(i);let group=groups.get(key);if(!group){group={vertices:0,triangles:0,min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};groups.set(key,group)}group.vertices++;for(let k=0;k<3;k++){const v=positions.get(i,k);if(!Number.isFinite(v))throw Error('Nonfinite position');group.min[k]=Math.min(group.min[k],v);group.max[k]=Math.max(group.max[k],v)}}
 for(let i=0;i<indices.count;i+=3)groups.get(root(indices.get(i))).triangles++
 result.push({mesh:mi,primitive:pi,connectedComponents:groups.size,degenerateIndexTriangles,largestComponents:[...groups.values()].sort((a,b)=>b.triangles-a.triangles).slice(0,15),hasUV:'TEXCOORD_0'in primitive.attributes,hasVertexColors:'COLOR_0'in primitive.attributes,hasSkinWeights:'WEIGHTS_0'in primitive.attributes})
}
const report={input,sourceChanged:false,note:'Geometric connectivity only; components do not identify hair, clothing, skin or anatomy.',primitives:result}
fs.writeFileSync(path.join(path.dirname(input),'topology-inspection.json'),JSON.stringify(report,null,2))
console.log(JSON.stringify(report,null,2))
