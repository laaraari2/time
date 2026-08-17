'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, KeyRound, Mail, Trash2, UserPlus, Users } from 'lucide-react';

interface ProjectTeacher { id: string; code?: string; name?: string; }
interface Project { id: string; name: string; teachers?: ProjectTeacher[]; }
interface TeacherAccount { id: string; code: string; name: string; accountId: string | null; userId: string