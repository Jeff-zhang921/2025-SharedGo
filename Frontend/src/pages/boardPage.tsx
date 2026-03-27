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
//reverse composebody
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
  //tan is use to identify it is general or q&a
  const [tab, setTab] = useState<Tab>("general");
  const [loading, setLoading] = useState(false);
  //toastMessage if for
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

  
  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      //encapsulate instead of send directly
      const response = await fetch(`${API_URL}/upload/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as { url?: string };
      const imageUrl = typeof data.url === "string" ? data.url.trim() : "";
      if (!imageUrl) {
        return null;
      }
      return imageUrl;
    } catch {
      return null;
    }
  };

  const handleGeneralImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    const error = validateImage(file);
    if (error) {
      event.target.value = "";
      setGeneralImage(null);
      return;
    }
    setGeneralImage(file);
  };


// ChangeEvent	Typing in inputs, checking boxes, or selecting dropdown options.
// FormEvent	Specifically for form submissions (onSubmit).
// MouseEvent	Clicks, double clicks, mouse enters/leaves.
// KeyboardEvent	Pressing keys (e.g., checking if the user pressed "Enter").
// FocusEvent	When an element gains or loses focus (onBlur, onFocus).
// DragEvent	Drag and drop interactions.
// ClipboardEvent	Copy, paste, and cut actions.
// TouchEvent	Mobile-specific touch interactions.
// PointerEvent	Modern unified event for mouse, touch, and pen.
// UIEvent	Base class for many of the above; used for scrolling.
  const handleQuestionImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    const error = validateImage(file);
    if (error) {
      event.target.value = "";
      setQuestionImage(null);
      return;
    }
    setQuestionImage(file);
  };
//HTMLInputElement	<input> (text, checkbox, file, radio).
//HTMLTextAreaElement	<textarea>
// HTMLSelectElement	<select>
// HTMLButtonElement	<button>
// HTMLFormElement	<form>
// HTMLDivElement	<div>
// HTMLAnchorElement	<a> (Links)
// HTMLImageElement	<img>
  const handleAnswerImageChange = (
    questionId: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    const error = validateImage(file);
    if (error) {
      event.target.value = "";
      setAnswerImage((prev) => ({ ...prev, [questionId]: null }));
      return;
    }
    setAnswerImage((prev) => ({ ...prev, [questionId]: file }));
  };

  const postGeneral = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!isValidEventId) {
      return;
    }

    const text = generalDraft.trim();
    if (!text && !generalImage) {
      return;
    }

    try {
      let imageUrl: string | null = null;
      if (generalImage) {
        imageUrl = await uploadImage(generalImage);
        if (!imageUrl) {
          return;
        }
      }

      const body = composeBody(text, imageUrl);
      if (!body) {
        return;
      }
      if (body.length > 1000) {
        return;
      }

      const response = await fetch(`${API_URL}/board/general/${parsedEventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        setToastMessage("fail to post general")
        return;
      }

      const created = (await response.json()) as GeneralMessage;
      // Show latest message on top immediately.
      setGeneralMessages((prev) => [created, ...prev]);
      setGeneralDraft("");
      setGeneralImage(null);
      form.reset();
      showSuccessToast("Message posted.");
    } catch {
      return;
    }
  };

  const postQuestion = async (event: FormEvent<HTMLFormElement>) => {
    //prevent page refresh
    event.preventDefault();
    const form = event.currentTarget;
    if (!isValidEventId) {
      return;
    }

    const text = questionDraft.trim();
    if (!text && !questionImage) {
      return;
    }

    try {
      let imageUrl: string | null = null;
      if (questionImage) {
        imageUrl = await uploadImage(questionImage);
        if (!imageUrl) {
          return;
        }
      }

      const body = composeBody(text, imageUrl);
      if (!body) {
        return;
      }
      if (body.length > 1000) {
        return;
      }

      const response = await fetch(
        `${API_URL}/board/qna/${parsedEventId}/question`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ body }),
        },
      );

      if (!response.ok) {
        return;
      }
      //everything inside the Question type, except for the answers property
      const created = (await response.json()) as Omit<Question, "answers">;
      // Show latest question on top immediately.
      //create a new object with created and answer is null, add that to previous
        setQuestions((prev) => [{ ...created, answers: [] }, ...prev]);
      setQuestionDraft("");
      setQuestionImage(null);
      form.reset();
      showSuccessToast("Question posted.");
    } catch {
      setToastMessage("fail to post question")
      return;
    }
  };

  const postAnswer = async ( event: FormEvent<HTMLFormElement>, questionId: number,) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!isValidEventId) {
      return;
    }

    const text = (answerDraft[questionId] || "").trim();
    const imageFile = answerImage[questionId] || null;

    if (!text && !imageFile) {
      return;
    }

    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          return;
        }
      }

      const body = composeBody(text, imageUrl);
      if (!body) {
        return;
      }
      if (body.length > 1000) {
        return;
      }

      const response = await fetch(`${API_URL}/board/qna/${parsedEventId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questionId, body }),
      });

      if (!response.ok) {
        return;
      }

      const created = (await response.json()) as Answer;
      setQuestions((prev) =>
        prev.map((question) =>
          question.id === questionId
            ? { ...question, answers: [...question.answers, created] } // Append answer under this question
            : question,
        ),
      );
      setAnswerDraft((prev) => ({ ...prev, [questionId]: "" }));
      setAnswerImage((prev) => ({ ...prev, [questionId]: null }));
      form.reset();
      showSuccessToast("Answer posted.");
    } catch {
      return;
    }
  };
  

  if (!isValidEventId) {
    return <div className="board-page">Invalid event id.</div>;
  }
  const renderBody = (body: string) => {
    const { text, imageUrl } = parseBody(body);
    return (
      <div className="board-content">
        
        {text && <p>{text}</p>}
        {imageUrl && <img src={imageUrl} alt="attachment" className="board-image" />}
      </div>
    );
  };

}


