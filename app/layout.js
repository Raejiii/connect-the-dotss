import "./globals.css"

export const metadata = {
  title: "Connect the Dots Game",
  description: "Connect numbered dots to reveal shapes",
    generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full w-full">
      <body className="h-full w-full m-0 p-0 overflow-hidden">{children}</body>
    </html>
  )
}
