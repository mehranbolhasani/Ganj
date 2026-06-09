'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { hybridApi } from '@/lib/hybrid-api';
import { Poet } from '@/lib/types';
import { normalizedPoetSlug } from '@/lib/ganjoor-slug';
import { FEATURED_POETS_FALLBACK } from '@/lib/featured-poets-fallback';
import FamousPoets from './FamousPoets';
import AlphabeticalPoets from './AlphabeticalPoets';
import AlphabeticalNav from './AlphabeticalNav';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';

// Define the 6 most famous poets by their slugs (from Ganjoor website)
const FAMOUS_POET_SLUGS = [
  'hafez',
  'saadi',
  'moulavi',
  'ferdousi',
  'attar',
  'nezami'
];

const POETS_CACHE_KEY = 'ganjeh-poets-cache-v1';
const POETS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CachedPoetsPayload {
  poets: Poet[];
  timestamp: number;
}

const getCachedPoets = (): Poet[] | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(POETS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPoetsPayload;
    if (!Array.isArray(parsed.poets)) return null;
    if (Date.now() - parsed.timestamp > POETS_CACHE_TTL_MS) {
      localStorage.removeItem(POETS_CACHE_KEY);
      return null;
    }
    return parsed.poets;
  } catch {
    return null;
  }
};

const setCachedPoets = (poets: Poet[]): void => {
  if (typeof window === 'undefined') return;

  try {
    const payload: CachedPoetsPayload = {
      poets,
      timestamp: Date.now(),
    };
    localStorage.setItem(POETS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
};

const PoetsGrid = () => {
  // Show the six featured cards immediately (no API wait); full list loads in background.
  const [poets, setPoets] = useState<Poet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLetter, setActiveLetter] = useState<string>('');
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);

  useEffect(() => {
    const loadPoets = async () => {
      const cachedPoets = getCachedPoets();
      if (cachedPoets && cachedPoets.length > 0) {
        setPoets(cachedPoets);
      }

      try {
        setLoading(true);
        setError(null);
        const poetsData = await hybridApi.getPoets();
        setPoets(poetsData);
        setCachedPoets(poetsData);
      } catch (err) {
        console.error('Error loading poets:', err);
        setError(err instanceof Error ? err.message : 'خطا در بارگذاری شاعران');
      } finally {
        setLoading(false);
      }
    };

    loadPoets();
  }, []);

  const handleLetterClick = (letter: string) => {
    setActiveLetter(letter);
    // Find the section with this letter and scroll to it
    const element = document.querySelector(`[data-letter="${letter}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAvailableLettersChange = useCallback((letters: string[]) => {
    setAvailableLetters(letters);
  }, []);

  // Memoize famous poets to prevent unnecessary recalculations
  const famousPoets = useMemo(() => {
    const matched = poets.filter((poet) => {
      const slug = normalizedPoetSlug(poet.slug);
      return slug && FAMOUS_POET_SLUGS.includes(slug);
    });
    if (matched.length > 0) {
      return matched;
    }
    if (poets.length === 0) {
      return FEATURED_POETS_FALLBACK;
    }
    const byId = new Map(poets.map((p) => [p.id, p]));
    const fromFallback = FEATURED_POETS_FALLBACK.map((fb) => byId.get(fb.id) ?? fb);
    return fromFallback;
  }, [poets]);

  // Memoize other poets (non-famous)
  const otherPoets = useMemo(() => {
    return poets.filter((poet) => {
      const slug = normalizedPoetSlug(poet.slug);
      return !slug || !FAMOUS_POET_SLUGS.includes(slug);
    });
  }, [poets]);

  if (error && poets.length === 0) {
    return (
      <div className="relative w-full">
        <p className="text-center text-sm text-muted-foreground mb-6">
          فهرست شاعران از سرور بارگذاری نشد؛ شاعرهای پرمخاطب به صورت آفلاین نمایش داده می‌شوند.
        </p>
        <FamousPoets poets={FEATURED_POETS_FALLBACK} />
      </div>
    );
  }

  return (
    <div className="relative w-full">

      {/* Famous Poets Section — static data first frame; merges with API when loaded */}
      <FamousPoets poets={famousPoets} />

      {loading && poets.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          در حال بارگذاری فهرست کامل شاعران...
        </p>
      )}

      {/* Alphabetical Poets Section */}
      <AlphabeticalPoets
        poets={otherPoets}
        famousPoetSlugs={FAMOUS_POET_SLUGS}
        onAvailableLettersChange={handleAvailableLettersChange}
      />

      {/* Sticky Alphabetical Navigation (desktop only) */}
      <div className="hidden md:block">
        <AlphabeticalNav
          onLetterClick={handleLetterClick}
          activeLetter={activeLetter}
          availableLetters={availableLetters}
        />
      </div>

        <div className="faal-banner-container max-w-full md:max-w-[640px] w-full mx-auto sticky bottom-0 z-50 h-28 md:h-36 flex items-center justify-center">
          <a href="/faal" className="faal-banner w-[80%] md:w-1/3 h-16 flex items-center justify-center bg-amber-800 rounded-full backdrop-blur-sm shadow-xl dark:shadow-md shadow-amber-900/60 z-30 overflow-hidden relative ring-2 ring-amber-500/20 hover:ring-2 hover:ring-amber-500/40 hover:w-[45%] transition-all duration-300 ease-in-out" target="_blank">
            <div className="faal-banner-content flex items-center justify-between w-full h-full px-4 relative z-20">
              <div className="faal-banner-content-title">
                <h3 className="relative text-4xl text-background flex items-center justify-center translate-y-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 235 167" className="w-16 h-auto"><path fill="#FFB900" d="M202.125 120.062q-1.437 0-2.375-2.124-.938-2.188-.938-5.438 0-.625.126-2.125.375-4.062 1.812-6.875 1.376-2.812 3.062-2.812 1.438 0 2.376 2.187 1 2.125 1 5.437 0 .688-.126 2.063-.375 4.062-1.812 6.875t-3.125 2.812m1.687-19.374q6.75 0 12-1.688t8.563-4.75q-.625-3.5-3.187-5.062-3.626 1.25-6.938 1.25-3.687 0-6.75-1.688-3-1.688-4.438-4.625l8.063-25 .125-.062q1.75-1 3.188-.813 5.624.813 10.124 4.063 4.563 3.186 7.188 8.5 2.625 5.311 2.625 12 0 8.687-6.813 20.249-4.5 7.563-10.624 12.313-6.063 4.687-14.813 4.687zm17.938-57.125q-1.437-1.626-4.438-3.563-2.937-2-6.75-3.937l8-11.063q4.563 1.688 6.938 3.813t2.375 4.5q0 1.25-.813 3-.811 1.686-2.25 3.437z"/><path fill="#FFB900" d="M198.125 29a1088 1088 0 0 0-3.313 31.688Q193.375 76.624 193.375 86q0 5.562.937 8.75.938 3.125 3.126 4.563 2.25 1.374 6.312 1.375L202 120.062q-7.062 0-10.938-3.062-3.811-3.062-5.25-8.312-1.374-5.313-1.374-13.188 0-9.687 1-24.187.999-14.563 1.812-20.5.625-4.813 1.938-8.626 1.374-3.875 2.812-6.5 1.5-2.625 3.625-5.874l1.5-2.375zM169.693 122.975q-.606-27.331-.218-45.577.4-18.809 2.108-25.586.976-4.73 3.335-9.806 2.422-5.137 6.912-13.419l1.824 2.415q-.933 5.668-1.802 14.152-.707 6.8-1.892 27.216-1.122 20.418-1.436 35.165-.345 16.183-6.628 29.428-6.285 13.307-17.198 20.826t-24.472 7.231q-9.185-.196-15.98-4.029t-10.398-10.786q-3.542-6.89-3.344-16.137.163-7.686 2.99-17.128 2.828-9.505 7.981-19.585l3.914 4.084q-3.368 8.431-5.117 14.27t-1.843 10.213q-.13 6.123 2.838 10.563 3.031 4.44 8.482 6.807 5.512 2.43 12.76 2.584 8.998.192 17.068-3.012 8.133-3.202 13.499-8.59 5.366-5.386 6.617-11.299"/><path fill="#fe9a00" d="M123.25 95.063q-1.437 0-2.375-2.126-.937-2.187-.937-5.437 0-.625.124-2.125.375-4.062 1.813-6.875 1.375-2.812 3.063-2.812 1.438 0 2.374 2.187 1 2.126 1 5.438 0 .687-.124 2.062-.376 4.062-1.813 6.875t-3.125 2.813m1.688-19.376q7.062 0 14.874-3.5 7.813-3.562 14.563-10.437-3.813-.312-12.313-1.812-6.311-1.125-8-1.126-4.187 0-6.624 2-2.439 1.938-3.688 5.063t-2.875 8.938q-.188.436-.437 1.437l-5.063-.062Q117 68.5 119.188 61.875q2.187-6.625 6.687-12.062 4.5-5.5 11.375-5.5 2.813 0 5.562.5 2.751.5 6.438 1.5 4.812 1.125 7.875 1.687t6.687.563q1.25 0 4.25-.25l.063.062q.563.499.563 1.313 0 .312-.126.687l-3.687 10.75q-2.5 1.938-9.813 10.938-.937 1.124-1.062 1.25-4.375 5.374-8.688 9.874-4.311 4.5-10.187 8.188t-11.875 3.688z"/><path fill="#fe9a00" d="M119.25 4a1084 1084 0 0 0-3.312 31.688Q114.5 51.624 114.5 61q0 5.562.938 8.75.936 3.125 3.124 4.563 2.25 1.374 6.313 1.374l-1.75 19.376q-7.062 0-10.937-3.063-3.813-3.062-5.25-8.312-1.376-5.313-1.376-13.188 0-9.687 1-24.187 1-14.563 1.813-20.5.626-4.813 1.937-8.625 1.376-3.875 2.813-6.5 1.5-2.625 3.625-5.876l1.5-2.375zM69.125 95.063q-1.437 0-2.375-2.126-.937-2.187-.937-5.437 0-.625.124-2.125.376-4.062 1.813-6.875 1.376-2.812 3.063-2.812 1.438 0 2.374 2.187 1 2.126 1 5.438 0 .687-.124 2.062-.376 4.062-1.813 6.875t-3.125 2.813m1.688-19.376q6.75 0 12-1.687t8.562-4.75q-.626-3.5-3.187-5.062-3.626 1.25-6.938 1.25-3.687 0-6.75-1.688-3-1.688-4.437-4.625l8.062-25 .125-.062q1.75-1 3.188-.813 5.624.813 10.124 4.063 4.563 3.187 7.188 8.5 2.625 5.311 2.625 12 0 8.686-6.812 20.25-4.5 7.561-10.626 12.312-6.062 4.688-14.812 4.688zM88.75 18.563Q87.313 16.938 84.313 15q-2.939-2-6.75-3.937l8-11.063q4.562 1.688 6.937 3.813t2.375 4.5q0 1.25-.812 3-.813 1.686-2.25 3.437z"/><path fill="#fe9a00" d="M19.563 95.063Q10 95.063 5.5 90.375 1 85.625 0 76.875l1.938-1.937q5.437.437 8.437.624 3 .126 8.75.126 14.563 0 23.188-2.563 8.625-2.625 12.624-8.562-.75-1.875-3.25-3.813-2.437-1.938-5.5-3.187-3.062-1.25-5.312-1.25-3.438 0-6.75 2-3.25 1.936-7.875 7.062-3.063 3.375-7.062 8.75a255 255 0 0 0-7.813 11.313l-3.125-3.25q5.938-9.626 15.25-22.313 7.125-9.75 12.563-14.187 5.5-4.438 10.687-4.438 4.437 0 8.063 2.875 3.687 2.813 5.75 7.125 2.061 4.25 2.062 8.375 0 7.062-6 15.438-5.937 8.374-15.875 14.187t-21.187 5.813M31.874 5.124q-1.437 8.188-2.125 14.188a214 214 0 0 0-.75 7.25q-.312 3.563-.562 7.062a787 787 0 0 1-1.125 14.5q-.438 4.376-2.5 10.125A79 79 0 0 1 20 69.313q-2.75 5.25-5.25 8.312l-3.312-.5Q15.563 70.687 17.062 64q1.563-6.687 1.563-14.25v-3.875q0-6.937.25-10.875.313-3.937 1.375-8.812 1-5.188 3.375-10.938T30 2.75zm37.188 89.938q-6 0-10.376-2.876-4.374-2.937-6.687-7.75-2.312-4.875-2.312-10.5l5.874-4.437q2.313 2.938 6.376 4.563Q66 75.687 70.75 75.687zm-14.626-68.5Q53 24.938 50 23q-2.937-2-6.75-3.937L51.25 8q4.563 1.688 6.938 3.813t2.374 4.5q0 1.25-.812 3Q58.937 21 57.5 22.75z"/><path fill="#e17100" d="M96.643 116.798q.206 1.548.308 3.528.127 2.457-.075 3.874-.198 1.519-.86 3.262a8.7 8.7 0 0 1-1.948 3.092q-1.284 1.349-3.262 1.451-2.628.136-3.865-1.937a10.8 10.8 0 0 1-.931-2.114q-.069.155-.14.31-1.067 2.191-2.8 3.589-1.71 1.394-3.713 1.499-1.776.092-3.132-.894-1.33-.987-2.097-2.706a10 10 0 0 1-.444-1.278q-1.158 2.236-2.896 3.663-1.79 1.446-3.969 1.807v.057q-.282.014-.55.016-.223.023-.45.036a.7.7 0 0 1-.327-.062q-1.157-.082-2.01-.445-1.31-.586-2.844-2.114-2.578.133-4.937 1.588-2.36 1.428-3.949 3.195-1.051 5.382-2.825 8.44t-4.492 4.355q-2.008.959-4.417 1.435a54 54 0 0 1-5.404.808l.192-2.599.755-.441q4.092-2.373 6.248-3.893 2.155-1.494 4.042-3.829 1.913-2.31 3.627-6.044a29 29 0 0 1 2.975-5.03q1.806-2.43 4.006-4.053 2.199-1.647 4.451-1.763.826-.043 1.395.279.592.296 1.352.935.892.734 1.614 1.098.585.275 1.421.288 2.722-.262 4.51-1.6 1.826-1.372 2.799-3.96.075-.222.158-.442l1.747-.19q-.163 1.215-.112 2.192.086 1.655 1.062 2.559.973.88 2.825.784 2.201-.115 3.71-1.524 1.507-1.411 2.01-3.825l1.801-.118q-.01.755.006 1.08.08 1.554.8 2.371.72.792 2.52.7a6.3 6.3 0 0 0 2.11-.461q.983-.404 1.453-1.005a18 18 0 0 1-.23-2.025 4.9 4.9 0 0 1 .416-2.133q.45-1.028 1.473-2.564zm-33.97 23.878q1.86.582 2.856 1.385.996.802 1.045 1.755.025.502-.264 1.195a6.6 6.6 0 0 1-.829 1.451l-1.146 1.592q-.61-.622-1.853-1.362a28 28 0 0 0-2.782-1.414 4 4 0 0 1-.196.588 6.6 6.6 0 0 1-.828 1.45l-1.148 1.593q-.609-.621-1.851-1.361a28 28 0 0 0-2.784-1.414l2.973-4.603q1.862.582 2.858 1.385.994.803 1.044 1.756.013.273-.067.602zm-19.645-18.371q.352 0 .676.15l-.35 2.385q-1.104 7.455-3.233 11.722-2.105 4.291-5.714 5.797a16.4 16.4 0 0 1-3.458.98q-1.854.351-6.466.753l.352-2.585q6.365-3.238 9.071-4.995 2.732-1.758 4.135-3.942 1.428-2.183 2.23-6.073.452-2.184 1.178-3.188.727-1.005 1.58-1.004m-3.432-22.567q.45 0 .902.076l.375.401a20.8 20.8 0 0 1-2.18 6.2q-.651-.276-1.553-.276-1.68 0-3.66 1.004a14 14 0 0 0-3.557 2.509q-1.555 1.506-2.08 2.937.25.879 1.403 1.381 1.178.477 3.433.879 2.43.426 3.633 1.053 1.203.603 1.655 1.757.476 1.13.451 3.264-.025 4.165-2.08 8.031-2.03 3.89-5.815 6.325-3.783 2.435-8.795 2.435-3.51 0-6.165-1.305a9.5 9.5 0 0 1-4.11-3.79Q10 130.109 10 126.57q0-3.463 1.178-7.731 1.203-4.292 3.382-8.584l1.43 1.381q-1.48 3.639-2.231 6.349-.727 2.712-.727 4.845 0 3.69 2.556 5.422 2.556 1.757 6.892 1.757 3.432 0 6.59-.954t5.113-2.485q1.98-1.506 2.105-3.062-.176-.502-1.228-.804-1.053-.301-2.983-.652-2.08-.376-3.608-.904-1.53-.526-2.581-1.581-1.053-1.079-1.053-2.786 0-3.187 2.356-7.254 2.381-4.066 5.84-6.927 3.482-2.862 6.565-2.862m12.57-1.784q-.326 2.284-.601 5.697-.175 1.883-.351 7.179-.326 8.082-.627 11.421a23.7 23.7 0 0 1-1.503 6.426q-1.177 3.087-2.656 5.421l-1.229-.778q.778-2.233 1.203-4.995.451-2.786.451-5.422v-1.857q0-11.62.652-14.633.35-1.908 1.253-3.966.927-2.084 2.656-5.447zm-10.541 11.274q1.83.677 2.781 1.531t.952 1.807q0 .502-.326 1.205a7 7 0 0 1-.901 1.38l-1.229 1.532q-.576-.653-1.779-1.431a25 25 0 0 0-2.706-1.581zm46.288-3.992q1.862.582 2.858 1.385.994.803 1.044 1.756.027.501-.263 1.22-.29.694-.83 1.425l-1.147 1.593q-.61-.621-1.85-1.337a25 25 0 0 0-2.783-1.438 4 4 0 0 1-.196.612q-.29.694-.83 1.426l-1.147 1.593q-.609-.623-1.851-1.337a25 25 0 0 0-2.784-1.44l2.973-4.602q1.863.581 2.858 1.385.994.803 1.044 1.755.013.268-.064.598zm-4.67-6.845q1.861.583 2.857 1.384.995.804 1.044 1.756.026.501-.262 1.22-.29.694-.83 1.426l-1.147 1.593q-.61-.623-1.851-1.337a25 25 0 0 0-2.785-1.44z" opacity=".8"/></svg>
                </h3>
              </div>

              <div className="faal-banner-content-description flex items-center justify-center gap-01 text-amber-200">
                <span className="text-xs font-medium">مشاهده</span>
                <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
              </div>
            </div>

            <div className="w-1/2 h-24 absolute -bottom-12 flex left-1/2 -translate-x-1/2 blur-2xl z-10">
              <div className="w-1/2 h-full bg-warning rounded-full aspect-square min-w-0 -translate-x-8 blur-3xl opacity-60"></div>
              <div className="w-1/2 h-full bg-warning rounded-full aspect-square min-w-0 -translate-x-8 blur-3xl opacity-80"></div>
              <div className="w-1/2 h-full bg-warning rounded-full aspect-square min-w-0 z-10 blur-3xl"></div>
              <div className="w-1/2 h-full bg-warning rounded-full aspect-square min-w-0 translate-x-8 blur-3xl opacity-80"></div>
              <div className="w-1/2 h-full bg-warning rounded-full aspect-square min-w-0 translate-x-8 blur-3xl opacity-60"></div>
            </div>
          </a>
        </div>
    </div>
  );
};

export default PoetsGrid;
