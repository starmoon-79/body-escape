import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, DragEvent, TouchEvent } from 'react';
import { Camera, XCircle, Loader2, ScanLine, Clock, Flag, Lock, Unlock, Delete, Send, Check, KeyRound, AlertCircle, Maximize, Minimize } from 'lucide-react';

const App = () => {
  // ==========================================
  // [설정] 미션 정답 및 구글 시트 연동 URL
  // ==========================================
  const PHASE1_TARGET = '6351'; 
  const PHASE2_TARGET = '5216'; 
  const PHASE3_TARGET = '420';  
  const PHASE4_TARGET = ['대동맥', '우심방', '폐동맥', '폐정맥', '좌심방']; 
  
  const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw-wxUY59QDrWX6JOAB-Ln31cNOpNBw9sWqxJOJY_U1RCy4qraEr7IZMi6EQCIbPEpoiw/exec'; 

  // ==========================================
  // 상태 관리 (TypeScript 타입 명시)
  // ==========================================
  const [currentPhase, setCurrentPhase] = useState<number>(1); 
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [completionTime, setCompletionTime] = useState<Date | null>(null); 
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // 1단계 상태 관리
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [userCode, setUserCode] = useState<string>(''); // 사용자가 사진 찍은 후 직접 입력할 코드
  const [phase1Status, setPhase1Status] = useState<'idle' | 'fail'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2단계 상태 관리
  const [doorLockInput, setDoorLockInput] = useState<string>('');
  const [doorLockError, setDoorLockError] = useState<boolean>(false);

  // 3단계 상태 관리
  const [padlockInput, setPadlockInput] = useState<string>('');
  const [padlockError, setPadlockError] = useState<boolean>(false);

  // 4단계 상태 관리
  const [cardInputs, setCardInputs] = useState<string[]>(['', '', '', '', '']);
  const [phase4Error, setPhase4Error] = useState<boolean>(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null); 
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 5단계 상태 관리
  const [teamName, setTeamName] = useState<string>('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle'); 

  // ==========================================
  // 폭죽(Confetti) 효과 함수
  // ==========================================
  const fireConfetti = () => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const myConfetti = (window as any).confetti;
      if (myConfetti) {
        myConfetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'],
          zIndex: 10000
        });
      }
    };
    document.body.appendChild(script);
  };

  // ==========================================
  // 공통 유틸리티
  // ==========================================
  useEffect(() => {
    let timerId: number | undefined;
    if (currentPhase >= 2 && currentPhase <= 4) {
      timerId = window.setInterval(() => setCurrentTime(new Date()), 1000);
    }
    return () => { if (timerId !== undefined) window.clearInterval(timerId); };
  }, [currentPhase]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date).replace(/\. /g, '-').replace(/\./g, '');
  };

  // ==========================================
  // 기능 로직
  // ==========================================
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setImageBase64(result.split(',')[1]);
          setImagePreview(result);
        }
        setPhase1Status('idle');
        setUserCode(''); // 사진을 새로 찍으면 입력칸 초기화
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!imageBase64 || userCode.length !== 4) return;
    setIsProcessing(true);
    setPhase1Status('idle');

    // 시스템이 검사하는 듯한 긴장감을 주기 위한 랜덤 딜레이 (3초 ~ 5초)
    const randomDelay = Math.floor(Math.random() * 2000) + 3000;
    await new Promise(resolve => setTimeout(resolve, randomDelay));

    setIsProcessing(false);
    
    if (userCode === PHASE1_TARGET) {
      setCurrentTime(new Date());
      setCurrentPhase(2);
    } else {
      setPhase1Status('fail');
    }
  };

  const handleKeypadClick = (num: string) => {
    if (doorLockInput.length < 10) { setDoorLockInput(prev => prev + num); setDoorLockError(false); }
  };
  const handleKeypadSubmit = () => {
    if (doorLockInput === PHASE2_TARGET) { setCurrentPhase(3); } 
    else { setDoorLockError(true); setDoorLockInput(''); }
  };

  const handlePadlockClick = (num: string) => {
    if (padlockInput.length < 10) { setPadlockInput(prev => prev + num); setPadlockError(false); }
  };
  const handlePadlockSubmit = () => {
    if (padlockInput === PHASE3_TARGET) { setCurrentPhase(4); } 
    else { setPadlockError(true); setPadlockInput(''); }
  };

  const placeWordInSlot = (word: string, index: number) => {
    const newInputs = [...cardInputs];
    const existingIndex = newInputs.indexOf(word);
    if (existingIndex !== -1) newInputs[existingIndex] = ''; 
    newInputs[index] = word;
    setCardInputs(newInputs);
    setSelectedWord(null);
    setPhase4Error(false);
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, word: string) => {
    e.dataTransfer.setData('word', word);
    setSelectedWord(word);
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    const word = e.dataTransfer.getData('word') || selectedWord || draggedWord;
    if (!word) return;
    placeWordInSlot(word, index);
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>, word: string) => {
    setSelectedWord(word);
    setDraggedWord(word);
    const touch = e.touches[0];
    setDragPosition({ x: touch.clientX, y: touch.clientY });
  };
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!draggedWord) return;
    e.preventDefault(); 
    const touch = e.touches[0];
    setDragPosition({ x: touch.clientX, y: touch.clientY });
  };
  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!draggedWord) return;
    const touch = e.changedTouches[0];
    const elementAtDrop = document.elementFromPoint(touch.clientX, touch.clientY);

    if (elementAtDrop) {
      let targetSlotIndex = elementAtDrop.getAttribute('data-slot-index');
      if (!targetSlotIndex && elementAtDrop.parentElement) {
        targetSlotIndex = elementAtDrop.parentElement.getAttribute('data-slot-index');
      }
      if (targetSlotIndex !== null && targetSlotIndex !== undefined) {
        placeWordInSlot(draggedWord, parseInt(targetSlotIndex, 10));
      }
    }
    setDraggedWord(null);
  };

  const handleSlotClick = (index: number) => {
    if (selectedWord) {
      placeWordInSlot(selectedWord, index);
    } else if (cardInputs[index]) {
      const newInputs = [...cardInputs];
      newInputs[index] = '';
      setCardInputs(newInputs);
    }
  };

  const handlePhase4Submit = () => {
    const isCorrect = cardInputs.every((val, i) => val === PHASE4_TARGET[i]);
    if (isCorrect) {
      const now = new Date();
      setCompletionTime(now); 
      setCurrentTime(now);
      setCurrentPhase(5); 
    } else {
      setPhase4Error(true);
    }
  };

  const submitToGoogleSheet = async () => {
    if (!teamName.trim()) return;
    setSubmitStatus('submitting');
    const data = { teamName, completionDate: formatDate(completionTime), completionTime: formatTime(completionTime) };

    try {
      if (GOOGLE_SHEET_WEB_APP_URL) {
        await fetch(GOOGLE_SHEET_WEB_APP_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      } else {
        await new Promise(r => setTimeout(r, 1000));
      }
      setSubmitStatus('success');
      fireConfetti(); // 성공 시 폭죽 애니메이션 실행!
    } catch (error) {
      setSubmitStatus('error');
    }
  };

  // ==========================================
  // 테마 및 디자인 설정
  // ==========================================
  const phaseThemes: Record<number, { bg: string; header: string; accent: string; badge: string }> = {
    1: { bg: 'bg-sky-50', header: 'bg-blue-600', accent: 'text-blue-600', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
    2: { bg: 'bg-teal-50', header: 'bg-teal-600', accent: 'text-teal-700', badge: 'bg-teal-100 text-teal-700 border-teal-200' },
    3: { bg: 'bg-orange-50', header: 'bg-orange-500', accent: 'text-orange-600', badge: 'bg-orange-100 text-orange-700 border-orange-200' },
    4: { bg: 'bg-fuchsia-50', header: 'bg-fuchsia-600', accent: 'text-fuchsia-600', badge: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200' },
    5: { bg: 'bg-yellow-50', header: 'bg-amber-500', accent: 'text-amber-600', badge: '' },
  };
  const theme = phaseThemes[currentPhase] || phaseThemes[1];
  const phaseEmoji: Record<number, string> = { 1: '', 2: '🫁 ', 3: '🧠 ', 4: '🫀 ', 5: '' };

  const getSlotClassName = (index: number) => {
    // 글자 크기를 위쪽 보기 단어 카드(text-sm sm:text-lg)와 완전히 동일하게 맞춰 작아보이는 현상 제거
    const base = "absolute flex items-center justify-center text-sm sm:text-lg font-black rounded-md cursor-pointer transition-all z-10 px-1";
    if (cardInputs[index]) return `${base} bg-fuchsia-100 text-fuchsia-800 border-2 border-fuchsia-400 shadow-md`;
    if (selectedWord) return `${base} bg-fuchsia-50/80 border-2 border-dashed border-fuchsia-400 animate-pulse`;
    return `${base} bg-white/40 border-2 border-dashed border-white/70 hover:bg-white/60`; // 살짝 반투명하게 하얀색을 띄워 인지하기 쉽게 함
  };

  const renderHeader = (phaseLabel: string, showClock = true, timeToDisplay: Date | null = currentTime) => (
    <div className="absolute top-0 left-0 w-full p-3 sm:p-4 flex justify-between items-start z-[100] bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className={`${theme.header} text-white px-3 sm:px-4 py-2 rounded-xl font-black text-sm sm:text-lg lg:text-xl flex items-center shadow-md animate-in slide-in-from-left-4 fade-in`}>
        <Flag className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-1.5 sm:mr-2 opacity-90 hidden sm:block" /> {phaseEmoji[currentPhase]}{phaseLabel}
      </div>
      
      <div className="flex items-center space-x-2">
        {showClock && (
          <div className="bg-white border-2 border-slate-200 rounded-xl p-2 sm:p-3 shadow-md flex items-center space-x-2 animate-in slide-in-from-right-4 fade-in">
            <Clock className={`w-4 h-4 sm:w-5 sm:h-5 hidden lg:block ${theme.accent}`} />
            <div className="flex flex-col items-end">
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold leading-none mb-1">
                {currentPhase === 5 ? '최종 완료 (KST)' : '진행 시간'}
              </span>
              <span className={`font-mono text-sm sm:text-lg lg:text-xl font-bold leading-none tracking-wider ${theme.accent}`}>
                {formatTime(timeToDisplay)}
              </span>
            </div>
          </div>
        )}
        <button 
          onClick={toggleFullscreen}
          className="bg-white border-2 border-slate-200 rounded-xl p-2 sm:p-3 shadow-md hover:bg-slate-50 text-slate-600 transition-colors flex items-center justify-center"
          title="전체화면 전환"
        >
          {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>
      </div>
    </div>
  );

  const renderPhaseContent = () => {
    // ------------------------------------------
    // [5단계] 최종 화면
    // ------------------------------------------
    if (currentPhase === 5) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 pt-24 space-y-6 w-full max-w-md mx-auto h-full overflow-y-auto relative">
          <div className="bg-white border-4 border-amber-300 rounded-[2rem] p-6 sm:p-8 shadow-xl w-full text-center animate-in zoom-in-95 duration-500 max-h-full z-10">
            <Unlock className="w-16 h-16 sm:w-24 sm:h-24 text-amber-500 mx-auto mb-4 sm:mb-6" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-amber-600 mb-2">방탈출 성공!</h2>
            <p className="text-slate-600 font-bold mb-6 sm:mb-8 text-sm sm:text-base">BODY ESCAPE의 모든 관문을 통과했습니다.</p>
            
            <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-200 inline-block w-full mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-amber-700 font-bold mb-1">인증용 최종 완료 시간</p>
              <p className="font-mono text-lg sm:text-xl md:text-2xl text-amber-600 font-black tracking-tight">
                {formatDate(completionTime)} {formatTime(completionTime)}
              </p>
            </div>

            {submitStatus !== 'success' ? (
              <div className="space-y-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-slate-200">
                <div className="text-left">
                  <label className="text-xs sm:text-sm font-bold text-slate-700 ml-1">모둠명 (또는 이름)</label>
                  <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="모둠명을 입력하세요" className="w-full mt-2 bg-white border-2 border-slate-300 rounded-xl px-4 py-2 sm:py-3 text-center text-slate-800 font-bold focus:outline-none focus:border-amber-500 transition-colors" />
                </div>
                <button onClick={submitToGoogleSheet} disabled={!teamName.trim() || submitStatus === 'submitting'} className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center transition-all ${!teamName.trim() || submitStatus === 'submitting' ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/30 active:scale-95'}`}>
                  {submitStatus === 'submitting' ? <><Loader2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 animate-spin" /> 전송 중...</> : <><Send className="w-5 h-5 sm:w-6 sm:h-6 mr-2" /> 완료 기록 제출하기</>}
                </button>
                {submitStatus === 'error' && <p className="text-red-500 text-xs sm:text-sm font-bold mt-2 flex justify-center items-center"><AlertCircle className="w-4 h-4 mr-1"/> 전송 실패. 네트워크를 확인하세요.</p>}
              </div>
            ) : (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 sm:p-6 flex flex-col items-center animate-in fade-in zoom-in duration-500 shadow-inner">
                <Check className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-500 mb-2 sm:mb-3 animate-bounce" />
                <p className="font-black text-2xl sm:text-3xl text-emerald-700 mb-1">🎉 미션 완벽 완수! 🎉</p>
                <p className="font-bold text-sm sm:text-base text-emerald-600 mb-2">최종 기록 제출이 완료되었습니다.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ------------------------------------------
    // [4단계] 포토카드 화면
    // ------------------------------------------
    if (currentPhase === 4) {
      const WORDS = ['대동맥', '우심방', '폐동맥', '폐정맥', '좌심방'];
      const availableWords = WORDS.filter(w => !cardInputs.includes(w));

      return (
        <div className="flex-1 flex flex-col items-center p-4 pt-20 sm:pt-24 space-y-4 sm:space-y-6 w-full max-w-5xl mx-auto h-full overflow-y-auto">
          {draggedWord && (
            <div className="fixed z-[110] px-4 py-2 bg-fuchsia-500 text-white font-black rounded-xl shadow-2xl opacity-80 pointer-events-none transform -translate-x-1/2 -translate-y-1/2" style={{ left: dragPosition.x, top: dragPosition.y }}>
              {draggedWord}
            </div>
          )}

          <div className="text-center space-y-2 sm:space-y-3 bg-white/70 backdrop-blur-sm p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-fuchsia-100 w-full shrink-0">
            <div className={`inline-flex items-center space-x-2 ${theme.badge} px-4 py-1.5 sm:py-2 rounded-full mb-1 sm:mb-2 text-xs sm:text-sm font-black border shadow-sm`}>
              <span>{phaseEmoji[4]}4단계 MISSION</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-fuchsia-600">3단계 자물쇠 해제 성공!</h2>
            <p className="text-slate-600 font-bold text-xs sm:text-base break-keep">마지막 관문입니다. 보기에 있는 단어를 터치하여 선택 후 빈칸을 누르거나, 드래그하여 채워주세요.</p>
          </div>

          <div className="w-full bg-white p-3 sm:p-4 rounded-2xl shadow-sm border-2 border-fuchsia-200 flex flex-wrap justify-center gap-1.5 sm:gap-2 animate-in fade-in slide-in-from-bottom-6 shrink-0">
            {availableWords.length === 0 ? (
              <span className="text-slate-400 font-bold py-1 sm:py-2 text-sm sm:text-base">모든 단어를 배치했습니다!</span>
            ) : (
              availableWords.map(word => (
                <div key={word} draggable onDragStart={(e) => handleDragStart(e, word)} onTouchStart={(e) => handleTouchStart(e, word)} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onClick={() => setSelectedWord(selectedWord === word ? null : word)} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black text-sm sm:text-lg cursor-grab active:cursor-grabbing transition-all select-none touch-none ${selectedWord === word ? 'bg-fuchsia-500 text-white shadow-lg scale-105 ring-2 ring-fuchsia-300' : 'bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200 border border-fuchsia-200'}`}>
                  {word}
                </div>
              ))
            )}
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 justify-items-center animate-in fade-in slide-in-from-bottom-8">
            <div className="relative w-full max-w-[280px] sm:max-w-[350px] shadow-[0_10px_30px_rgba(33,44,102,0.3)] rounded-xl overflow-hidden border-[3px] sm:border-4 border-[#212c66] bg-[#3a478b]">
               <img src="1.png" alt="대순환(체순환)" className="w-full h-auto block" onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/312e81/ffffff?text=Image+1.png'; }} />
               {/* 1번 이미지 (대순환) 위치, 크기 완벽 조정: 너비 28%, 높이 15%로 늘려 배경 점선을 완전히 덮음 */}
               <div data-slot-index="0" onDrop={(e) => handleDrop(e, 0)} onDragOver={handleDragOver} onClick={() => handleSlotClick(0)} className={`${getSlotClassName(0)} top-[40%] left-[41%] w-[28%] h-[15%]`}>{cardInputs[0]}</div>
               <div data-slot-index="1" onDrop={(e) => handleDrop(e, 1)} onDragOver={handleDragOver} onClick={() => handleSlotClick(1)} className={`${getSlotClassName(1)} top-[71%] left-[52%] w-[28%] h-[15%]`}>{cardInputs[1]}</div>
            </div>

            <div className="relative w-full max-w-[280px] sm:max-w-[350px] shadow-[0_10px_30px_rgba(33,44,102,0.3)] rounded-xl overflow-hidden border-[3px] sm:border-4 border-[#212c66] bg-[#3a478b]">
               <img src="2.png" alt="소순환(폐순환)" className="w-full h-auto block" onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/312e81/ffffff?text=Image+2.png'; }} />
               {/* 2번 이미지 (소순환) 위치, 크기 완벽 조정: 너비 28%, 높이 15%로 늘려 배경 점선을 완전히 덮음 */}
               <div data-slot-index="2" onDrop={(e) => handleDrop(e, 2)} onDragOver={handleDragOver} onClick={() => handleSlotClick(2)} className={`${getSlotClassName(2)} top-[40%] left-[41%] w-[28%] h-[15%]`}>{cardInputs[2]}</div>
               <div data-slot-index="3" onDrop={(e) => handleDrop(e, 3)} onDragOver={handleDragOver} onClick={() => handleSlotClick(3)} className={`${getSlotClassName(3)} top-[71%] left-[26%] w-[28%] h-[15%]`}>{cardInputs[3]}</div>
               <div data-slot-index="4" onDrop={(e) => handleDrop(e, 4)} onDragOver={handleDragOver} onClick={() => handleSlotClick(4)} className={`${getSlotClassName(4)} top-[71%] left-[61%] w-[28%] h-[15%]`}>{cardInputs[4]}</div>
            </div>
          </div>

          <div className="w-full max-w-sm flex flex-col items-center pb-8 shrink-0 mt-4 sm:mt-8">
            {phase4Error && <p className="text-red-500 font-black mb-2 sm:mb-4 bg-red-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-red-300 animate-pulse flex items-center text-xs sm:text-base"><AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"/> 정답이 아닙니다. 다시 확인해주세요.</p>}
            <button onClick={handlePhase4Submit} className="w-full py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl md:text-2xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-xl shadow-fuchsia-600/30 active:scale-95 transition-all border-b-4 border-fuchsia-800 active:border-b-0 active:translate-y-1">정답 제출하기</button>
          </div>
        </div>
      );
    }

    // ------------------------------------------
    // [3단계] 버튼 자물쇠 화면
    // ------------------------------------------
    if (currentPhase === 3) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 pt-20 sm:pt-24 space-y-4 sm:space-y-8 w-full max-w-3xl mx-auto h-full overflow-y-auto">
          <div className="text-center space-y-2 sm:space-y-3 bg-white/70 backdrop-blur-sm p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-orange-100 w-full">
            <div className={`inline-flex items-center space-x-2 ${theme.badge} px-4 py-1.5 sm:py-2 rounded-full mb-1 sm:mb-2 text-xs sm:text-sm font-black border shadow-sm`}>
              <span>{phaseEmoji[3]}3단계 MISSION</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-orange-500">2단계 미션 성공!</h2>
            <p className="text-slate-600 font-bold text-xs sm:text-base break-keep">단서를 종합하여 자물쇠를 해제하세요.</p>
          </div>
          
          <div className="w-full max-w-xs sm:max-w-sm mt-6 sm:mt-12 animate-in fade-in slide-in-from-bottom-8 relative pb-8">
            <div className="bg-gradient-to-b from-slate-200 to-slate-400 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] shadow-[0_15px_30px_rgba(0,0,0,0.2)] border-y-4 sm:border-y-8 border-x-2 sm:border-x-4 border-slate-300 relative z-10">
              <div className="absolute -top-10 sm:-top-16 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-16 sm:h-24 border-[12px] sm:border-[16px] border-b-0 border-slate-300 rounded-t-full shadow-[inset_0_4px_10px_rgba(0,0,0,0.1)] -z-10"></div>
              <div className="text-center mb-4 sm:mb-6 mt-2 sm:mt-4 flex flex-col items-center">
                <KeyRound className="w-8 h-8 sm:w-10 sm:h-10 text-slate-600 mb-1 sm:mb-2 drop-shadow-sm" />
                <h3 className="text-slate-700 font-black tracking-widest text-sm sm:text-xl">SECURITY PADLOCK</h3>
              </div>
              <div className={`bg-slate-800 text-center py-2 sm:py-4 px-2 rounded-lg sm:rounded-xl mb-6 sm:mb-8 border-2 sm:border-[3px] shadow-[inset_0_4px_8px_rgba(0,0,0,0.5)] h-14 sm:h-20 flex flex-col justify-center transition-colors ${padlockError ? 'border-red-500 bg-red-950' : 'border-slate-600'}`}>
                {padlockError ? <span className="font-mono text-xl sm:text-2xl text-red-500 font-black tracking-widest animate-pulse">ERROR</span> : <span className="font-mono text-2xl sm:text-4xl text-emerald-400 font-black tracking-[0.5em] text-shadow">{padlockInput ? '*'.repeat(padlockInput.length) : '-'}</span>}
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button key={num} onClick={() => handlePadlockClick(num.toString())} className="bg-white hover:bg-slate-50 text-slate-800 rounded-full aspect-square text-xl sm:text-3xl font-black shadow-[0_4px_0_#94a3b8,0_10px_15px_rgba(0,0,0,0.2)] sm:shadow-[0_8px_0_#94a3b8,0_15px_20px_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px] sm:active:translate-y-[8px] transition-all flex items-center justify-center border sm:border-2 border-slate-200">{num}</button>
                ))}
                <button onClick={() => { setPadlockInput(prev => prev.slice(0, -1)); setPadlockError(false); }} className="bg-red-500 hover:bg-red-400 text-white rounded-full aspect-square font-black shadow-[0_4px_0_#9f1239,0_10px_15px_rgba(0,0,0,0.2)] sm:shadow-[0_8px_0_#9f1239,0_15px_20px_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px] sm:active:translate-y-[8px] transition-all flex items-center justify-center border sm:border-2 border-red-600"><Delete className="w-5 h-5 sm:w-8 sm:h-8" /></button>
                <button onClick={() => handlePadlockClick('0')} className="bg-white hover:bg-slate-50 text-slate-800 rounded-full aspect-square text-xl sm:text-3xl font-black shadow-[0_4px_0_#94a3b8,0_10px_15px_rgba(0,0,0,0.2)] sm:shadow-[0_8px_0_#94a3b8,0_15px_20px_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px] sm:active:translate-y-[8px] transition-all flex items-center justify-center border sm:border-2 border-slate-200">0</button>
                <button onClick={handlePadlockSubmit} className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-full aspect-square text-xs sm:text-lg font-black shadow-[0_4px_0_#059669,0_10px_15px_rgba(0,0,0,0.2)] sm:shadow-[0_8px_0_#059669,0_15px_20px_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px] sm:active:translate-y-[8px] transition-all flex items-center justify-center border sm:border-2 border-emerald-600 tracking-tighter">OPEN</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ------------------------------------------
    // [2단계] 디지털 도어락 화면
    // ------------------------------------------
    if (currentPhase === 2) {
      return (
        <div className="flex-1 flex flex-col items-center p-4 pt-20 sm:pt-24 space-y-4 sm:space-y-6 w-full max-w-5xl mx-auto h-full overflow-y-auto">
          <div className="text-center space-y-2 sm:space-y-3 animate-in fade-in slide-in-from-bottom-4 bg-white/70 backdrop-blur-sm p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-teal-100 w-full shrink-0">
            <div className={`inline-flex items-center space-x-2 ${theme.badge} px-4 py-1.5 sm:py-2 rounded-full mb-1 sm:mb-2 text-xs sm:text-sm font-black border shadow-sm`}>
              <span>{phaseEmoji[2]}2단계 MISSION</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-teal-600">1단계 미션 성공!</h2>
            <p className="text-slate-600 font-bold text-xs sm:text-base break-keep">아래의 힌트를 해석하여 도어락 비밀번호를 풀어보세요.</p>
          </div>
          
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 animate-in fade-in slide-in-from-bottom-6 shrink-0">
            <div className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-teal-100 shadow-md flex flex-col">
              <div className="text-xs sm:text-sm text-teal-700 mb-2 font-black px-1 flex items-center"><span className="bg-teal-100 px-2 py-0.5 sm:py-1 rounded-full border border-teal-200 mr-2">힌트 1</span> 폐용적 및 폐용량</div>
              <div className="rounded-xl overflow-hidden bg-slate-50 flex-1 flex items-center justify-center border border-slate-200 min-h-[120px]">
                <img src="3.jpg" alt="폐용적 표" className="max-w-full max-h-[25dvh] md:max-h-[35dvh] object-contain" onError={(e) => { e.currentTarget.src = 'https://placehold.co/1000x500/f8fafc/0f766e?text=Image+3.jpg'; }} />
              </div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-teal-100 shadow-md flex flex-col">
              <div className="text-xs sm:text-sm text-teal-700 mb-2 font-black px-1 flex items-center"><span className="bg-teal-100 px-2 py-0.5 sm:py-1 rounded-full border border-teal-200 mr-2">힌트 2</span> 폐용적 그래프</div>
              <div className="rounded-xl overflow-hidden bg-slate-50 flex-1 flex items-center justify-center border border-slate-200 min-h-[120px]">
                <img src="4.jpg" alt="폐용적 그래프" className="max-w-full max-h-[25dvh] md:max-h-[35dvh] object-contain" onError={(e) => { e.currentTarget.src = 'https://placehold.co/1000x600/ccfbf1/0f766e?text=Image+4.jpg'; }} />
              </div>
            </div>
          </div>

          <div className="w-full max-w-[280px] sm:max-w-sm mt-4 sm:mt-8 animate-in fade-in slide-in-from-bottom-8 shrink-0 pb-8">
            <div className="bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.1)] border-t border-white border-x border-slate-100 ring-1 ring-slate-200">
              <div className="flex items-center justify-center mb-4 sm:mb-6 text-slate-400">
                <Lock className="w-5 h-5 sm:w-6 h-6 mr-1 sm:mr-2" />
                <span className="font-bold tracking-[0.2em] text-xs sm:text-sm">SMART DOORLOCK</span>
              </div>
              <div className={`bg-slate-900 text-center py-2 sm:py-4 px-2 rounded-xl sm:rounded-2xl mb-6 sm:mb-8 border-[3px] sm:border-[4px] shadow-inner h-14 sm:h-20 flex flex-col justify-center transition-colors ${doorLockError ? 'border-red-400 bg-slate-800' : 'border-slate-800'}`}>
                {doorLockError ? <span className="font-mono text-lg sm:text-2xl text-red-400 font-bold tracking-widest animate-pulse">ERROR</span> : <span className="font-mono text-2xl sm:text-4xl text-cyan-300 font-bold tracking-[0.3em] text-shadow-sm">{doorLockInput ? '*'.repeat(doorLockInput.length) : <span className="text-slate-600 opacity-50 font-sans tracking-widest text-sm sm:text-lg">INPUT</span>}</span>}
              </div>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button key={num} onClick={() => handleKeypadClick(num.toString())} className="aspect-square bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xl sm:text-2xl font-mono font-black shadow-sm border border-slate-200 active:scale-95 transition-all flex items-center justify-center">{num}</button>
                ))}
                <button onClick={() => { setDoorLockInput(prev => prev.slice(0, -1)); setDoorLockError(false); }} className="aspect-square bg-slate-100 hover:bg-red-50 text-red-500 rounded-full shadow-sm border border-slate-200 active:scale-95 flex items-center justify-center"><Delete className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                <button onClick={() => handleKeypadClick('0')} className="aspect-square bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xl sm:text-2xl font-mono font-black shadow-sm border border-slate-200 active:scale-95 flex items-center justify-center">0</button>
                <button onClick={handleKeypadSubmit} className="aspect-square bg-teal-500 hover:bg-teal-400 text-white rounded-full text-2xl sm:text-3xl font-black shadow-md shadow-teal-500/30 border border-teal-400 active:scale-95 flex items-center justify-center pt-1 sm:pt-2">*</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ------------------------------------------
    // [1단계] 초기화면 (스캐너) - 수정된 버전
    // ------------------------------------------
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 pt-20 space-y-6 w-full max-w-md mx-auto h-full overflow-y-auto">
        <div className="text-center space-y-2 sm:space-y-3 bg-white/60 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-blue-50 backdrop-blur-sm w-full shrink-0 mt-8">
          <div className={`${theme.badge} inline-flex items-center space-x-2 px-4 py-1.5 sm:py-2 rounded-full mb-1 sm:mb-2 text-xs sm:text-sm font-black border shadow-sm`}>
            <span>1단계 MISSION</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-blue-600 drop-shadow-sm mb-1 sm:mb-2">BODY ESCAPE</h1>
          <p className="text-slate-600 font-bold text-xs sm:text-sm md:text-base break-keep">완성된 숫자 코드를 사진으로 찍어 인증하세요.</p>
        </div>

        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 border border-slate-200 shadow-xl space-y-4 sm:space-y-6 w-full shrink-0">
          <div className="relative w-full aspect-video sm:aspect-square max-h-[30dvh] sm:max-h-none bg-slate-50 rounded-xl sm:rounded-2xl border-2 border-dashed border-blue-300 overflow-hidden flex flex-col items-center justify-center">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="text-center text-slate-400 p-4 sm:p-6 flex flex-col items-center"><ScanLine className="w-12 h-12 sm:w-20 sm:h-20 mb-2 sm:mb-4 text-blue-300" /><p className="font-bold text-xs sm:text-base">카메라 버튼을 눌러 촬영</p></div>
            )}
          </div>
          
          <div className="w-full">
            <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" ref={fileInputRef} />
            <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="w-full flex items-center justify-center py-3 sm:py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-2xl text-base sm:text-lg font-black transition-colors border border-slate-200 shadow-sm"><Camera className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />사진 촬영하기</button>
          </div>

          {/* 사진을 찍어야만 입력칸이 보이도록 설정 */}
          {imagePreview && (
            <div className="w-full animate-in fade-in slide-in-from-top-4 flex flex-col items-center space-y-3 pt-4 border-t-2 border-dashed border-slate-100">
              <p className="text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">사진의 숫자를 확인하고 아래에 입력하세요.</p>
              <input 
                type="text" 
                maxLength={4} 
                inputMode="numeric"
                value={userCode} 
                onChange={(e) => {setUserCode(e.target.value.replace(/[^0-9]/g, '')); setPhase1Status('idle');}} 
                className="w-[200px] border-2 border-slate-300 rounded-xl px-4 py-3 text-center font-mono text-2xl sm:text-3xl font-black focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-800" 
                placeholder="0000" 
              />
            </div>
          )}

          <button 
            onClick={analyzeImage} 
            disabled={!imageBase64 || userCode.length !== 4 || isProcessing} 
            className={`w-full py-3 sm:py-5 rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center transition-all ${(!imageBase64 || userCode.length !== 4 || isProcessing) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 active:scale-95'}`}
          >
            {isProcessing ? <><Loader2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 animate-spin" /> 판독 진행 중...</> : '비밀번호 해독하기'}
          </button>
        </div>

        {phase1Status === 'fail' && (
          <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 bg-red-50 border-red-200 text-red-600 shadow-sm animate-in fade-in slide-in-from-bottom-4 w-full shrink-0 pb-8">
            <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
              <XCircle className="w-10 h-10 sm:w-16 sm:h-16 text-red-500 mb-1 sm:mb-2" />
              <h2 className="text-xl sm:text-2xl font-black text-red-600">접근 거부</h2>
              <p className="text-red-500/80 font-bold text-sm sm:text-base">입력 코드: <span className="font-mono text-lg sm:text-xl text-red-700 bg-red-100 px-2 py-1 rounded-md sm:rounded-lg border border-red-200 ml-1">{userCode}</span></p>
              <p className="text-xs sm:text-sm font-bold mt-1">올바른 비밀번호가 아닙니다.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // 앱 컨테이너 렌더링
  // ==========================================
  return (
    <div className="bg-[#0f172a] min-h-screen sm:p-2 md:p-4 flex items-center justify-center font-sans">
      <div 
        className={`w-full ${isFullscreen ? 'fixed inset-0 z-[9999] h-full max-w-none rounded-none' : 'max-w-[calc(100vh*16/9)] h-[100dvh] md:h-[90vh] md:max-h-[900px] md:aspect-video md:rounded-3xl'} ${theme.bg} shadow-2xl overflow-hidden flex flex-col relative transition-all duration-300`}
      >
        {currentPhase > 0 && renderHeader(
          currentPhase === 1 ? '1단계' : currentPhase === 2 ? '2단계' : currentPhase === 3 ? '3단계' : currentPhase === 4 ? '4단계' : '탈출 성공!',
          true,
          currentPhase === 5 ? completionTime : currentTime
        )}
        {renderPhaseContent()}
      </div>
    </div>
  );
};

export default App;
