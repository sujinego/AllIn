"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, PenSquare, User, LogOut, Bookmark, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as UserType } from "@/types";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => setUser(data));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => setUser(data));
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const navLinks = [
    { href: "/posts", label: "후기 모아보기" },
    { href: "/posts?category=self", label: "반셀프" },
    { href: "/posts?category=turnkey", label: "턴키업체" },
    { href: "/timeline", label: "🏗️ 공사일지" },
  ];

  return (
    <header
      className="sticky top-0 z-50 bg-white border-b"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "var(--color-accent)" }}
          >
            올인
          </div>
          <span
            className="font-bold text-lg hidden sm:block"
            style={{ color: "var(--color-accent-dark)" }}
          >
            인테리어 정보 커뮤니티
          </span>
          <span
            className="font-bold text-lg sm:hidden"
            style={{ color: "var(--color-accent-dark)" }}
          >
            인비공
          </span>
        </Link>

        {/* 데스크탑 네비 */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors"
              style={{
                color:
                  pathname === link.href
                    ? "var(--color-accent)"
                    : "var(--color-text-secondary)",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 우측 버튼 */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/posts/new"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--color-accent)" }}
              >
                <PenSquare size={15} />
                후기 작성
              </Link>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center justify-center w-9 h-9 rounded-full border transition-colors hover:bg-gray-50"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <User
                    size={18}
                    style={{ color: "var(--color-text-secondary)" }}
                  />
                </button>
                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border py-1 z-50"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div
                      className="px-3 py-2 border-b"
                      style={{ borderColor: "var(--color-border-light)" }}
                    >
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {user.nickname}
                      </p>
                    </div>
                    <Link
                      href="/me"
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                      style={{ color: "var(--color-text-secondary)" }}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <UserCircle size={15} /> 내 정보
                    </Link>
                    <Link
                      href="/me/bookmarks"
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                      style={{ color: "var(--color-text-secondary)" }}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Bookmark size={15} /> 북마크
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-gray-50"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <LogOut size={15} /> 로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              로그인
            </Link>
          )}

          {/* 모바일 메뉴 버튼 */}
          <button
            className="md:hidden p-2 rounded-lg"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X size={20} style={{ color: "var(--color-text-secondary)" }} />
            ) : (
              <Menu
                size={20}
                style={{ color: "var(--color-text-secondary)" }}
              />
            )}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {menuOpen && (
        <div
          className="md:hidden border-t bg-white"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2.5 text-sm font-medium"
                style={{ color: "var(--color-text-secondary)" }}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/posts/new"
                className="mt-2 py-2.5 text-center rounded-lg text-sm font-medium text-white"
                style={{ background: "var(--color-accent)" }}
                onClick={() => setMenuOpen(false)}
              >
                후기 작성하기
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
