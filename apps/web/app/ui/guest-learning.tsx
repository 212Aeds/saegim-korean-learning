"use client";
import {createContext,useContext} from "react";
export const GuestLearningContext=createContext(false);
export const useGuestLearning=()=>useContext(GuestLearningContext);
