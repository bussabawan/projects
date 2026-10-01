import { GameMemoryModel } from '@/lib/models/gameMemory';

export class MemoryGameService {
  private static formatMediaUrl(url: string | undefined | null): string {
    if (!url) return ''; 
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    if (url.startsWith('/api/uploads/') || url.startsWith('/api/files/')) return url;
    
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

  static async generateGameData(exerciseId: number, numQuestions: number, numAnswers: number, numTargets: number = 1) {
    // 1. Get all target images for the exercise
    const allTargetImages = await GameMemoryModel.getExerciseImages(exerciseId);
    if (!allTargetImages || allTargetImages.length === 0) {
      throw new Error("ไม่พบข้อมูลรูปภาพสำหรับแบบฝึกหัดนี้ โปรดติดต่อเจ้าหน้าที่");
    }

    const questions = [];
    
    // สร้างถุงสุ่ม (Draw Pile)
    let drawPile = this.shuffleArray(allTargetImages);

    // Loop for numQuestions
    for (let i = 0; i < numQuestions; i++) {
      // ถ้ารูปในถุงเหลือน้อยกว่าจำนวนโจทย์ที่ต้องจำ ให้เอาภาพทั้งหมดมาสับใหม่
      if (drawPile.length < numTargets) {
        drawPile = this.shuffleArray(allTargetImages);
      }
      
      // ดึงภาพออกจากถุงตามจำนวน numTargets
      const selectedTargets = drawPile.splice(0, numTargets);
      const targetIds = selectedTargets.map(t => t.id);

      // Get distractors (excluding all targets)
      const numDistractors = Math.max(1, numAnswers - numTargets);
      const distractors = await GameMemoryModel.getRandomImages(numDistractors, targetIds, exerciseId);
      
      // Combine targets and distractors
      const rawChoices = [...selectedTargets, ...distractors];
      
      // Format choices and shuffle them
      const choices = this.shuffleArray(rawChoices.map(c => ({
        ...c,
        imageUrl: this.formatMediaUrl(c.imageUrl) || '/placeholder-image.png',
        audioUrl: this.formatMediaUrl(c.audioUrl)
      })));

      // Format targets
      const formattedTargets = selectedTargets.map(t => ({
        ...t,
        imageUrl: this.formatMediaUrl(t.imageUrl) || '/placeholder-image.png',
        audioUrl: this.formatMediaUrl(t.audioUrl)
      }));

      questions.push({
        targets: formattedTargets,
        choices: choices,
      });
    }

    return questions;
  }
}
