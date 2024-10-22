import Link from "next/link";
import React from "react";

const Header = () => {
  return (
    <div className="divide-y border-gray-200 dark:border-gray-800 border-b">
      <div className="px-4 py-3 md:py-6 lg:px-6">
        <div className="flex items-center space-y-2 md:space-y-0 md:space-x-6">
          <Link href="https://www.pmda.go.jp/" className="text-2xl font-bold tracking-tighter mr-4">
            PMDA
          </Link>
          <nav className="flex items-center space-x-6 text-sm">
            <Link
              className="font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              href="/"
            >
              最適使用ガイドライン
            </Link>
            <Link
              className="font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              href="/judgment"
            >
              PD-L1判定
            </Link>
            <Link
              className="bg-black py-3 px-4 text-white rounded-md font-medium"
              href="/bbs-posts/create"
            >
              Create Post
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Header;