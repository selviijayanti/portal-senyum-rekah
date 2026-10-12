import { collection, getDocs, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const initialLayanan = [
  {
    nama: "Konsultasi & Pemeriksaan Gigi",
    durasiMenit: 30,
    harga: 50000,
    aktif: true,
  },
  {
    nama: "Pembersihan Karang Gigi (Scaling)",
    durasiMenit: 30,
    harga: 200000,
    aktif: true,
  },
  {
    nama: "Tambal Gigi Komposit",
    durasiMenit: 30,
    harga: 250000,
    aktif: true,
  },
  {
    nama: "Cabut Gigi",
    durasiMenit: 30,
    harga: 250000,
    aktif: true,
  },
  {
    nama: "Perawatan Saluran Akar",
    durasiMenit: 60,
    harga: 450000,
    aktif: true,
  },
];

export async function seedInitialData() {
  try {
    // 1. Cek apakah koleksi layanan sudah ada data
    const layananSnap = await getDocs(collection(db, "layanan"));
    if (layananSnap.empty) {
      console.log("Mengisi seed data layanan...");
      for (const item of initialLayanan) {
        await addDoc(collection(db, "layanan"), {
          ...item,
          dibuatPada: serverTimestamp(),
        });
      }
      return { success: true, message: "Seed data layanan berhasil ditambahkan!" };
    }
    return { success: true, message: "Data layanan sudah tersedia." };
  } catch (error) {
    console.error("Gagal menjalankan seed data:", error);
    return { success: false, error: error.message };
  }
}
