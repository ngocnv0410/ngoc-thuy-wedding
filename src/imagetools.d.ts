// Kiểu cho ảnh import qua vite-imagetools với directive `as=picture`.
declare module '*as=picture' {
  const picture: import('./content/types').ResponsiveImage
  export default picture
}
