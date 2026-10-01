export interface IStorageService {
  /**
   * Uploads a file buffer and returns the generated filename or URL
   */
  uploadFile(buffer: Buffer, originalFilename: string, isAudio: boolean): Promise<string>;
  
  /**
   * Reads a file from storage
   */
  getFile(filename: string, isAudio: boolean): Promise<Buffer | null>;
  
  /**
   * Deletes a file from storage
   */
  deleteFile(filename: string, isAudio: boolean): Promise<boolean>;
}
