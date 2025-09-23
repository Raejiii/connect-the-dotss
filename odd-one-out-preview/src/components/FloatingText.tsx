function FloatingText({
  message,
  ...props
}: React.ComponentProps<"div"> & { message: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <div
      {...props}
      className="fixed inset-0 pointer-events-none text-center flex items-center justify-center z-[70]"
    >
      <div
        className="md:text-6xl text-4xl lg:text-7xl font-bold text-green-400 animate-fade-in"
        style={{
          textShadow:
            "4px 4px 8px rgba(128, 0, 128, 0.8), -2px -2px 4px rgba(0, 0, 0, 0.6)",
          filter: "drop-shadow(0 0 10px rgba(0, 255, 0, 0.7))",
        }}
      >
        {message}
      </div>
    </div>
  );
}

export default FloatingText;
