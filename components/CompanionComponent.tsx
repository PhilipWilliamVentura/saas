'use client';

import { cn, configureAssistant, getSubjectColor } from '@/lib/utils'
import { vapi } from '@/lib/vapi.sdk';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react'
import soundwaves from '@/constants/soundwaves.json'
import { addToSessionHistory } from '@/lib/actions/companion.actions';

enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED',
}

const CompanionComponent = ({ companionId, subject, topic, name, userName, userImage, style, voice}: CompanionComponentProps) => {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE); 
  const [isSpeaking, setisSpeaking] = useState(false)
  const [isMuted, setisMuted] = useState(false)
  const [messages, setmessages] = useState<SavedMessage[]>([])
  const [infoText, setInfoText] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [diagramText, setdiagramText] = useState("")
  const [answer, setAnswer] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if(lottieRef) {
        if(isSpeaking) {lottieRef.current?.play()}
        else {lottieRef.current?.stop()}
    }
  }, [isSpeaking, lottieRef])

  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);

    const onCallEnd = () => {
        setCallStatus(CallStatus.FINISHED);
        addToSessionHistory(companionId)
    }
        

    const onMessage = (message:Message) => {
        if(message.type === 'transcript' && message.transcriptType === 'final') {
            const newMessage = { role: message.role, content: message.transcript}
            setmessages((prev) => [newMessage, ...prev])
        }
    }

    const onSpeechStart = () => setisSpeaking(true)
    const onSpeechEnd = () => setisSpeaking(false)

    const onError = (error: Error) => console.log('Error', error)

    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('message', onMessage);
    vapi.on('error', onError);
    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);

    return () => {
    vapi.off('call-start', onCallStart);
    vapi.off('call-end', onCallEnd);
    vapi.off('message', onMessage);
    vapi.off('error', onError);
    vapi.off('speech-start', onSpeechStart);
    vapi.off('speech-end', onSpeechEnd);
    }
  }, []);

  const toggleMicrophone = () => {
    const isMuted = vapi.isMuted();
    vapi.setMuted(!isMuted);
    setisMuted(!isMuted)
  }

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING)

    const assistantOverrides = {
        variableValues : {
            subject, topic, style
        },
        clientMessages: ['transcript'],
        serverMessages: [],
    }

    // @ts-expect-error
    vapi.start(configureAssistant(voice, style), assistantOverrides)
  }

  const handleDisconnect = async () => {
    setCallStatus(CallStatus.FINISHED)
    vapi.stop()
  }

  const handleRAGSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: infoText, question: questionText, diagram: diagramText }),
      });
      const data = await res.json();
      setAnswer(data.answer);
      setImageUrl(data.image_url);
    } catch (err) {
      console.error('Error sending request:', err);
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <section className='flex flex-col h-[70vh]'>
        <section className='flex gap-8 max-sm:flex-col'>
            <div className='companion-section'>
                <div className='companion-avatar' style={{backgroundImage: getSubjectColor(subject)}}>
                    <div className=
                    {cn('absolute transition-opacity duration-1000',
                        callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE ? 'opacity-100' : "opacity-0",
                        callStatus === CallStatus.CONNECTING && 'opacity-100 animate-pulse'
                    )}>
                        <Image src={`/icons/${subject}.svg`} alt={subject} width={150} height={150} className='max-sm:w-fit' />
                    </div>

                    <div className={cn('absolute transition-opacity duration-1000',
                        callStatus === CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0'
                    )}>
                        <Lottie 
                            lottieRef={lottieRef}
                            animationData={soundwaves}
                            autoplay={false}
                            className='companion-lottie'
                        />
                    </div>
                </div>
                <p className='font-bold text-2xl'>{name}</p>
            </div>

            <div className='user-section'>
                <div className='user-avatar'>
                    <Image src={userImage} alt={userName} width={130} height={130} className='rounded-lg'/>
                    <p className='font-bold text-2xl'>
                        {userName}
                    </p>
                </div>
                <button className='btn-mic' onClick={toggleMicrophone} disabled={callStatus !== CallStatus.ACTIVE}>
                    <Image src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'} alt='mic' width={36} height={36}/>
                    <p className='max-sm:hidden'>{isMuted ? 'Turn on microphone' : 'Turn off microphone'}</p>
                </button>
                <button className={cn('rounded-lg py-2 cursor-pointer transition-colors w-full text-white', 
                    callStatus === CallStatus.ACTIVE ? 'bg-red-700' : 'bg-primary',
                    callStatus === CallStatus.CONNECTING && 'animate-pulse')} 
                    onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}>
                    {callStatus === CallStatus.ACTIVE ? 'End Session'
                    : callStatus === CallStatus.CONNECTING ? 'Connecting'
                    : 'Start Session'}
                </button>
            </div>
        </section>
        <section className="transcript min-h-[200px] max-h-[400px] overflow-y-auto bg-white border border-gray-200 rounded-xl p-4 shadow-sm mt-4">
            <div className="transcript-message space-y-3">
                {messages.map((message, index) => {
                if (message.role === "assistant") {
                    return (
                    <p
                        key={index}
                        className="text-gray-800 whitespace-normal break-words leading-relaxed"
                    >
                        <span className="font-semibold" style={{
                            backgroundImage: getSubjectColor(subject),
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            color: "transparent",
                            WebkitTextFillColor: "transparent",
                        }}>
                        {name.split(" ")[0].replace(/[.,]/g, "")}:
                        </span>{" "}
                        {message.content}
                    </p>
                    );
                } else {
                    return (
                    <p
                        key={index}
                        className="text-primary whitespace-normal break-words leading-relaxed"
                    >
                        <span className="font-semibold">{userName}:</span>{" "}
                        {message.content}
                    </p>
                    );
                }
                })}
            </div>
            </section>
        <section className='py-5'>
            <form className="w-full space-y-3">
                <label className="block text-lg font-medium text-gray-700">
                    Maybe you need our RAG Bot? Enter information that confuse you and a question you have about it.
                </label>
                <textarea
                    value={infoText}
                    onChange={(e) => setInfoText(e.target.value)}
                    placeholder="Paste or type the text here..."
                    rows={10}
                    className="w-full rounded-2xl border border-gray-300 p-4 text-gray-900 shadow-sm focus:border-black focus:ring-2 focus:ring-black focus:outline-none resize-none"
                />
                <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Paste or type the question here..."
                    rows={2}
                    className="w-full rounded-2xl border border-gray-300 p-4 text-gray-900 shadow-sm focus:border-black focus:ring-2 focus:ring-black focus:outline-none resize-none"
                />
                <label className="block text-lg font-medium text-gray-700">
                    Need a Diagram to support the RAG bot's answer. Try out our diffuser!
                </label>
                <textarea
                    value={diagramText}
                    onChange={(e) => setdiagramText(e.target.value)}
                    placeholder="Paste or type the description of your diagram here..."
                    rows={5}
                    className="w-full rounded-2xl border border-gray-300 p-4 text-gray-900 shadow-sm focus:border-black focus:ring-2 focus:ring-black focus:outline-none resize-none"
                />
                <button
                    type="button"
                    onClick={handleRAGSubmit}
                    disabled={isLoading}
                    className="w-full bg-black text-white font-semibold py-3 rounded-2xl hover:bg-indigo-900 transition-colors"
                    >
                    {isLoading ? 'Generating response...' : 'Ask RAG Bot'}
                </button>
            </form>
        </section>
        {answer && <p className="mt-4 p-2 border rounded bg-gray-50">{answer}</p>}
        {imageUrl && <img src={imageUrl} alt="Diagram" className="mt-4 max-w-sm" />}
    </section>
  )
}

export default CompanionComponent
