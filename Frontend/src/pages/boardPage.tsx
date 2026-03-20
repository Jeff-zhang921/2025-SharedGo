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
  // Store text and image URL in one string field for backend compatibility.
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
  // Case 1: image-only payload, e.g. "IMG::https://..."
  if (body.startsWith(IMAGE_PREFIX)) {
    const imageUrl = body.slice(IMAGE_PREFIX.length).trim();
    return { text: "", imageUrl: imageUrl || null };
  }

  // Case 2: text + image payload, split by "\nIMG::"
  const marker = `\n${IMAGE_PREFIX}`;
  const markerIndex = body.indexOf(marker);
  if (markerIndex === -1) {
    // Case 3: text-only payload
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
  // Key is questionId, so each question keeps its own draft text.
  const [answerDraft, setAnswerDraft] = useState<Record<number, string>>({});
  const [generalImage, setGeneralImage] = useState<File | null>(null);
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  // Key is questionId, so each question keeps its own selected image.
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

  useEffect(() => {
    if (!isValidEventId) {
      return;
    }

    const loadBoard = async () => {
      setLoading(true);

      const endpoint =
        tab === "general"
          ? `${API_URL}/board/general/${parsedEventId}`
          : `${API_URL}/board/qna/${parsedEventId}`;

      try {
        const response = await fetch(endpoint, { credentials: "include" });
        if (!response.ok) {
          if (tab === "general") {
            setGeneralMessages([]);
          } else {
            setQuestions([]);
          }
          return;
        }

        const data = await response.json();
        if (tab === "general") {
          const messages = Array.isArray(data) ? (data as GeneralMessage[]) : [];
          const newestFirst = [...messages].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          setGeneralMessages(newestFirst);
          return;
        }

        const list = Array.isArray(data) ? (data as Question[]) : [];
        const normalized = list.map((item) => ({
            ...item,
            answers: Array.isArray(item.answers) ? item.answers : [],
          }));
        const newestFirst = [...normalized].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setQuestions(newestFirst);
      } catch {
        if (tab === "general") {
          setGeneralMessages([]);
        } else {
          setQuestions([]);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadBoard();
  }, [isValidEventId, parsedEventId, tab]);

  
}


