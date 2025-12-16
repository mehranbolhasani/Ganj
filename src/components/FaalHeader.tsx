'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';

export default function FaalHeader() {
  return (
    <header className="w-full sm:container-responsive flex flex-col md:flex-row gap-4 md:gap-0 items-center justify-between z-10 relative">
      {/* Right side - Logo */}
      <div className="flex items-center gap-1">
        <Link href="/" className="flex items-center gap-1 flex-row-reverse text-amber-100 dark:text-amber-500 hover:opacity-80 transition-opacity">
          <span className="text-md font-abar abar-wght-700 translate-y-0.5">دفتر گنج</span>
          <div className="w-8 h-8 grid items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" color="currentColor" viewBox="0 0 24 24"><path fill="currentColor" fillRule="evenodd" d="M19.543 1.25c.4142 0 .75.336.75.75s-.3358.75-.75.75H6.5c-.9534 0-1.7283.762-1.749 1.711.0007.013.0029.027.003.04v.104c.0541.918.815 1.645 1.746 1.645H16c.4538 0 .87-.001 1.248.009-.001-.352-.0049-.582-.0283-.756-.013-.097-.0281-.145-.0371-.167a.1506.1506 0 0 0-.0049-.011l-.0009-.002-.002-.001c-.0019-.001-.0057-.003-.0107-.005-.0218-.009-.0705-.024-.167-.037-.2107-.028-.5047-.03-.9971-.03H6.5a.7501.7501 0 0 1-.75-.75c0-.414.3358-.75.75-.75H16c.4502 0 .8634-.002 1.1973.043.3554.048.731.161 1.04.47.309.309.4219.684.4697 1.04.0421.312.042.694.042 1.111.4472.109.8527.299 1.1953.642.4554.455.6412 1.021.7256 1.649.0815.606.0801 1.373.0801 2.295v7c0 .922.0014 1.689-.0801 2.295-.0844.628-.2702 1.194-.7256 1.649-.4553.456-1.0218.641-1.6494.726-.6062.081-1.3733.08-2.2949.08h-5.9961c-1.3927 0-2.5131.002-3.3916-.116-.9001-.121-1.6588-.381-2.2607-.983-.6017-.601-.8605-1.359-.9815-2.259-.118-.879-.1162-1.999-.1162-3.392V4.636C3.2521 4.591 3.25 4.545 3.25 4.5c0-1.795 1.455-3.25 3.25-3.25h13.043ZM4.754 16c0 1.435.001 2.436.1025 3.191.0986.734.2798 1.123.5566 1.4.2767.276.665.457 1.3984.555.7554.102 1.757.104 3.1924.104H16c.964 0 1.6117-.001 2.0947-.066.4614-.062.6588-.17.7891-.3.1303-.131.2378-.328.2998-.789.0325-.242.0491-.525.0576-.867L19.25 18v-7c0-.964-.0015-1.612-.0664-2.095-.0621-.461-.1695-.658-.2998-.789-.1303-.13-.3277-.238-.7891-.3-.483-.065-1.1307-.066-2.0947-.066H6.5c-.643 0-1.2416-.188-1.746-.51V16Zm7.746-.25c.4142 0 .75.336.75.75s-.3358.75-.75.75h-4a.7501.7501 0 0 1-.75-.75c0-.414.3358-.75.75-.75h4Zm3-4c.4142 0 .75.336.75.75s-.3358.75-.75.75h-7a.7501.7501 0 0 1-.75-.75c0-.414.3358-.75.75-.75h7Z" clipRule="evenodd"/></svg>
          </div>
        </Link>
      </div>

      <Link
          href="/"
          className="text-sm text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1"
        >
          بازگشت به صفحه اصلی
          <ArrowLeftIcon className="w-4 h-4" />
        </Link>
    </header>
  );
}

