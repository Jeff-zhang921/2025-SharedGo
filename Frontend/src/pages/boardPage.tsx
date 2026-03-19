import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
// import "./boardPage.css";

type Tab = "general" | "question";

type GeneralMessage = {
  id: number;
  body: string;
  createdAt: string;
};

type Answer = {
  id: number;
  body: string;
  authorId: number;
  createdAt: string;
};

type Question = {
  id: number;
  body: string;
  authorId: number;
  createdAt: string;
  answers: Answer[];
};


const API_URL = import.meta.env.VITE_API_URL;
const IMAGE_PREFIX = "IMG::";
const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

const validateImage = (file: File | null) => {
  if (!file) {
    return null;
  }
  if (!file.type.startsWith("image/")) {
    return "Only image files are allowed.";
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return "Image must be smaller than 10MB.";
  }
  return null;
};
const composeBody = (text: string, imageUrl: string | null) => {
  const trimmed = text.trim();
  if (imageUrl && trimmed) {
    return `${trimmed}\n${IMAGE_PREFIX}${imageUrl}`;
  }
  if (imageUrl) {
    return `${IMAGE_PREFIX}${imageUrl}`;
  }
  return trimmed;
};
const parseBody = (rawBody: string) => {
  const body = rawBody.trim();
  if (body.startsWith(IMAGE_PREFIX)) {
    const imageUrl = body.slice(IMAGE_PREFIX.length).trim();
    return { text: "", imageUrl: imageUrl || null };
  }

  const marker = `\n${IMAGE_PREFIX}`;
  const markerIndex = body.indexOf(marker);
  if (markerIndex === -1) {
    return { text: body, imageUrl: null };
  }

  const text = body.slice(0, markerIndex).trim();
  const imageUrl = body.slice(markerIndex + marker.length).trim();
  return { text, imageUrl: imageUrl || null };
};

export default function BoardPage() {
    
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const parsedEventId = Number(eventId);
  const isValidEventId = Number.isInteger(parsedEventId) && parsedEventId > 0;
  
  const [tab, setTab] = useState<Tab>("general");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const [generalMessages, setGeneralMessages] = useState<GeneralMessage[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [generalDraft, setGeneralDraft] = useState("");
  const [questionDraft, setQuestionDraft] = useState("");
  const [answerDraft, setAnswerDraft] = useState<Record<number, string>>({});
  const [generalImage, setGeneralImage] = useState<File | null>(null);
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [answerImage, setAnswerImage] = useState<Record<number, File | null>>({});

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  useEffect(() => {
    if (!showToast) {
      return;
    }

    const timer = setTimeout(() => {
      setShowToast(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [showToast, toastMessage]);

}


