import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./boardPage.css";

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

