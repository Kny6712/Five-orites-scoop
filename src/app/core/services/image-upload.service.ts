// src/app/core/services/image-upload.service.ts
// Five-orites Scoop — Product image upload via Cloudinary (unsigned preset, no secret in app)

import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

// Uploads are downscaled client-side first to keep them fast and small.
const MAX_SIDE_PX = 1024;

function readAsImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    img.src = url;
  });
}

function downscale(img: HTMLImageElement): Promise<Blob> {
  const scale = Math.min(1, MAX_SIDE_PX / Math.max(img.width, img.height));
  const w = Math.max(Math.round(img.width * scale), 1);
  const h = Math.max(Math.round(img.height * scale), 1);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image processing is not supported on this device.');
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process that image.'))),
      'image/jpeg',
      0.85
    );
  });
}

@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  get isConfigured(): boolean {
    const c = environment.cloudinary;
    return !!c && !!c.cloudName && !!c.uploadPreset;
  }

  /** Uploads a device image to Cloudinary and returns its HTTPS URL. */
  async uploadProductImage(file: File): Promise<string> {
    const c = environment.cloudinary;
    if (!c || !c.cloudName || !c.uploadPreset) {
      throw new Error('Cloudinary is not configured. Ask your admin to add the cloud name + upload preset.');
    }
    if (!file.type.startsWith('image/')) {
      throw new Error('Please choose an image file.');
    }

    const blob = await downscale(await readAsImage(file));
    const form = new FormData();
    form.append('file', blob, 'product.jpg');
    form.append('upload_preset', c.uploadPreset);
    form.append('folder', 'five-orites-scoop/products');

    let res: Response;
    try {
      res = await fetch(`https://api.cloudinary.com/v1_1/${c.cloudName}/image/upload`, {
        method: 'POST',
        body: form,
      });
    } catch {
      throw new Error('Upload failed. Check your internet connection and try again.');
    }
    const json = (await res.json()) as { secure_url?: string; error?: { message?: string } };
    if (!res.ok || !json.secure_url) {
      throw new Error(json.error?.message ?? 'Image upload failed. Check your upload preset.');
    }
    return json.secure_url;
  }
}
