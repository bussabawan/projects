import { GameMatchingModel } from '@/lib/models/gameMatching';


export class MatchingGameService {
  private static formatMediaUrl(url: string | undefined | null): string {
    if (!url) return ''; 
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    if (url.startsWith('/api/uploads/') || url.startsWith('/api/files/')) return url;
    
    // Extract just the filename to prevent directory traversal errors in the API route
    const filename = url.split('/').pop();
    return `/api/uploads/${filename}`;
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  static async generateGameData(exerciseId: number, numQuestions: number, numAnswers: number) {
    // 1. Get all target images for the exercise
    const allTargetImages = await GameMatchingModel.getExerciseImages(exerciseId);
    if (!allTargetImages || allTargetImages.length === 0) {
      throw new Error("ไม่พบข้อมูลรูปภาพสำหรับแบบฝึกหัดนี้ โปรดติดต่อเจ้าหน้าที่");
    }

    // Shuffle and pick numQuestions target images
    const shuffledTargets = this.shuffleArray(allTargetImages);
    const selectedTargets = shuffledTargets.slice(0, numQuestions);

    const questions = [];

    // 2. For each target image, pick distractor images
    for (const target of selectedTargets) {
      // Get distractors (excluding the target itself)
      const distractors = await GameMatchingModel.getRandomImages(numAnswers - 1, [target.id], exerciseId);
      
      // Combine target and distractors
      const rawChoices = [target, ...distractors];
      
      const choices = rawChoices.map(c => ({
        ...c,
        imageUrl: this.formatMediaUrl(c.imageUrl) || '/placeholder-image.png',
        audioUrl: this.formatMediaUrl(c.audioUrl)
      }));

      // Shuffle choices
      const shuffledChoices = this.shuffleArray(choices);

      questions.push({
        target: { 
          ...target, 
          imageUrl: this.formatMediaUrl(target.imageUrl) || '/placeholder-image.png',
          audioUrl: this.formatMediaUrl(target.audioUrl)
        },
        choices: shuffledChoices,
      });
    }

    return questions;
  }
}
