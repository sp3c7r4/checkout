import cloudinary from 'cloudinary'
import { randomUUID } from 'crypto';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


class Cloudinary {
  private cloudinary: typeof cloudinary.v2;

  constructor() {
    this.cloudinary = cloudinary.v2
  }

  async upload_image(image: string): Promise<string> {
    try {
      const image_id = randomUUID()
      const { public_id } = await this.cloudinary.uploader.upload(image, {
        folder: 'checkout_business_images',
        public_id: image_id,
      });
      console.log('Cloudinary upload response:', { public_id });
      return this.optimizeUrl(public_id);
    } catch (error) {
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  optimizeUrl(public_id: string): string {
    return this.cloudinary.url(public_id, {
      fetch_format: 'png',
      quality: 'auto'
    });
  }
}

export default new Cloudinary();