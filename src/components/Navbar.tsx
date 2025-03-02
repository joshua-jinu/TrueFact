"use client";

import { Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar(){
    const path = usePathname();

    return (<nav>

        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <Link href='/' className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">TrueFact</h1>
            </Link>
            <nav className="flex space-x-8">
                {
                    (path=='/') ?
                    <>
                        <a href="#how-it-works" className="text-gray-700 hover:text-blue-600">How it Works</a>
                        <a href="#about" className="text-gray-700 hover:text-blue-600">About</a>
                    </> 
                    :
                    <>
                        <Link href="/" className="text-gray-700 hover:text-blue-600">Back to Home</Link>
                    </>     
                }
            </nav>
            </div>
        </header>

    </nav>);
}