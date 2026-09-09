import { auth } from "@/auth";
import { getUserMatchingGameHistory } from "@/app/actions/matchingActions";
import { getUserMemoryGameHistory } from "@/app/actions/memoryActions";
import SummaryClient from "./SummaryClient";
import { redirect } from "next/navigation";

export default async function SummaryPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth();
  
  if (!session || !session.user) {
    redirect('/login');
  }

  // Next 15 requires searchParams to be awaited
  const searchParams = await props.searchParams;
  const gameType = searchParams?.gameType || 'matching';

  // Fetch recent game history
  let historyRaw = [];
  if (gameType === 'memory') {
    historyRaw = await getUserMemoryGameHistory(10);
  } else {
    historyRaw = await getUserMatchingGameHistory(10);
  }
  
  // Transform history data for the chart
  const historyData = historyRaw.map((log, index) => {
    // Score logic: (correctCount / totalQuestions) * (correctCount / clickCount) * 100
    const accuracyLog = log.clickCount > 0 ? (log.correctCount / log.clickCount) : 0;
    const score = log.totalQuestions > 0 ? Math.round((log.correctCount / log.totalQuestions) * accuracyLog * 100) : 0;
    
    // Format date to dd/MM/yyyy
    const date = new Date(log.testDate);
    const dateString = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    
    return {
      name: `ครั้งที่ ${index + 1}`,
      date: dateString,
      score: score,
    };
  });

  return (
    <SummaryClient 
      historyData={historyData} 
    />
  );
}
