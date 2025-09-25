import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">IoT Water Level Device Registry</h1>
        <p className="text-lg text-gray-600">水位センサーデバイスの登録と管理を行います</p>
        <div className="flex gap-4">
          <Link href="/devices" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600">
            デバイス一覧へ
          </Link>
          <Link href="/dashboard" className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600">
            ダッシュボード
          </Link>
        </div>
      </main>
    </div>
  );
}

