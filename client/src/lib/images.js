const defaultQuality = 0.82;

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function compressImageFile(file, options = {}) {
  if (!file) return null;
  if (!file.type?.startsWith("image/")) {
    throw new Error("Please upload an image file.");
  }

  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = defaultQuality,
    maxBytes = 1_600_000,
    outputType = "image/jpeg",
    background = "#ffffff"
  } = options;

  const image = await loadImage(file);
  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not process this image.");

  if (outputType === "image/jpeg") {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(image, 0, 0, width, height);

  const dataUrl = encodeCanvas(canvas, outputType, quality, maxBytes);
  return {
    dataUrl,
    originalBytes: file.size,
    compressedBytes: dataUrlBytes(dataUrl),
    width,
    height
  };
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The selected image could not be loaded."));
    };
    image.src = url;
  });
}

function dataUrlBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.round((base64.length * 3) / 4);
}

function encodeCanvas(canvas, outputType, quality, maxBytes) {
  if (outputType !== "image/jpeg") return canvas.toDataURL(outputType, quality);

  let currentQuality = quality;
  let dataUrl = canvas.toDataURL(outputType, currentQuality);
  while (dataUrlBytes(dataUrl) > maxBytes && currentQuality > 0.55) {
    currentQuality = Math.max(0.55, currentQuality - 0.08);
    dataUrl = canvas.toDataURL(outputType, currentQuality);
  }
  return dataUrl;
}
