'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarDays, ChevronLeft, LogOut, RefreshCw, School, UserRound, BookOpen, Network, Clock3, Wifi, WifiOff } from 'lucide-react';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import { subscribeToProfileChanges } from '../lib/supabase/realtime';
import type { SavedScheduleProfile, ClassGroup, Teacher, TimePeriod } from '../types';

type View = 'schedule' | 'assignments' | 'teachers' | 'structure';
const fallbackDays = ['الاثنين', 'الثلاثاء