"use server";

import { auth } from "@/auth";
import { GameMemoryModel } from '@/lib/models/gameMemory';

import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function getExerciseMaxAudioTime(exerciseId: number): Promise<number> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT MAX(pd.audio_time) as maxTime 
       FROM photo_in_exercises pie
       JOIN photo_data pd ON pie.photo_id = pd.photo_id
       WHERE pie.exercises_id = ? AND pie.remove = 0 AND pd.remove = 0`,
      [exerciseId]
    );
    return rows[0]?.maxTime || 2.5;
  } catch (error) {
    console.error("Failed to fetch max audio time:", error);
    return 2.5; // fallback
  }
}

export async function getMemoryGameData(exerciseId: number, numQuestions: number, numAnswers: number, numTargets: number = 1) {
  try {
    // 1. Get all target images for the exercise
    const allTargetImages = await GameMemoryModel.getExerciseImages(exerciseId);
    if (!allTargetImages || allTargetImages.length === 0) {
      return { success: false, error: "ไม่พบข้อมูลรูปภาพสำหรับแบบฝึกหัดนี้ โปรดติดต่อเจ้าหน้าที่" };
    }

    // Helper to format media URL
    const formatMediaUrl = (url: string | undefined | null) => {
      if (!url) return ''; 
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
      if (url.startsWith('/api/uploads/') || url.startsWith('/api/files/')) return url;
      
      const filename = url.split('/').pop();
      return `/api/uploads/${filename}`;
    };

    // Helper: Fisher-Yates Shuffle
    const shuffleArray = <T>(array: T[]): T[] => {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    };

    const questions = [];
    
    // สร้างถุงสุ่ม (Draw Pile)
    let drawPile = shuffleArray(allTargetImages);

    // Loop for numQuestions
    for (let i = 0; i < numQuestions; i++) {
      // ถ้ารูปในถุงเหลือน้อยกว่าจำนวนโจทย์ที่ต้องจำ ให้เอาภาพทั้งหมดมาสับใหม่
      if (drawPile.length < numTargets) {
        drawPile = shuffleArray(allTargetImages);
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
      const choices = shuffleArray(rawChoices.map(c => ({
        ...c,
        imageUrl: formatMediaUrl(c.imageUrl) || '/placeholder-image.png',
        audioUrl: formatMediaUrl(c.audioUrl)
      })));

      // Format targets
      const formattedTargets = selectedTargets.map(t => ({
        ...t,
        imageUrl: formatMediaUrl(t.imageUrl) || '/placeholder-image.png',
        audioUrl: formatMediaUrl(t.audioUrl)
      }));

      questions.push({
        targets: formattedTargets,
        choices: choices,
      });
    }

    return { success: true, data: questions };
  } catch (error) {
    console.error("Failed to fetch memory game data:", error);
    return { success: false, error: "Failed to load game data" };
  }
}

export async function saveMemoryGameResult(
  exerciseId: number,
  logData: {
    totalQuestions: number;
    totalAnswers: number;
    displayTime: number;
    clickCount: number;
    correctCount: number;
    incorrectCount: number;
  }, 
  timeLogs: {
    photoId: number;
    timePerQuestion: string;
  }[]
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: "Unauthorized" };
    }
    
    await GameMemoryModel.saveGameLog(Number(session.user.id), exerciseId, logData, timeLogs);
    return { success: true };
  } catch (error) {
    console.error("Failed to save memory game result:", error);
    return { success: false, error: "Failed to save game result" };
  }
}

export async function getUserMemoryGameHistory(limit: number = 7) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) return [];
    return await GameMemoryModel.getUserGameHistory(Number(session.user.id), limit);
  } catch (e) {
    console.error(e);
    return [];
  }
}
