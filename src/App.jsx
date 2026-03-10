import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, Search, Moon, Sun, LayoutDashboard, ChevronLeft,
  Menu, AlertTriangle, Clock, CheckCircle2,
  ShieldCheck, Info, ClipboardCheck, Download, LogOut, Lock
} from 'lucide-react';

// User credentials (hardcoded for demo - in production, use proper authentication)
const USERS = {
  admin: { password: 'admin123', role: 'admin', name: 'Administrator' },
  user: { password: 'user123', role: 'user', name: 'Petugas Monitoring' }
};

// CSV Parser - Loads data from external CSV file
const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map((line, idx) => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const row = {};
    headers.forEach((h, i) => {
      let val = values[i] || '';
      // Handle NIP - strip extra quotes and handle scientific notation
      if (h === 'NIP') {
        val = val.replace(/"/g, ''); // Remove all quotes
        if (val.includes('E')) {
          val = String(Math.round(parseFloat(val)));
        }
      }
      // Handle TMT date format (M/D/YYYY to YYYY-MM-DD)
      if (h === 'TMT' || h === 'TMT. PENSIUN') {
        const parts = val.split('/');
        if (parts.length === 3) {
          val = `${parts[2].padStart(4, '20')}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
      }
      row[h] = val;
    });
    // Map CSV headers to app fields
    return {
      id: idx + 1,
      Nama: row['Nama'] || '',
      NIP: row['NIP'] || row['No'] || '',
      Pangkat: row['Pangkat'] || '',
      Jabatan: row['Jabatan Terakhir'] || row['Jabatan'] || '',
      TMT: row['TMT'] || row['TMT. PENSIUN'] || '',
      Unit: row['Unit Kerja'] || row['Unit'] || '',
      Operator: row['Operator'] || '',
      StatusPensiun: row['Status Pensiun'] || 'BUP'
    };
  });
};

const loadCSVData = async () => {
  try {
    const response = await fetch('./data pensiun 2026.csv');
    const text = await response.text();
    return parseCSV(text);
  } catch (e) {
    console.warn('Could not load CSV, using fallback data:', e);
    return null;
  }
};

const getStatusDetail = (pns) => {
  const tmtDate = new Date(pns.TMT);
  const today = new Date();
  const diffTime = tmtDate - today;
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44));

  if (pns.Status === 'Done') {
    return {
      urgency: "done",
      urgencyLabel: "Selesai",
      keterangan: "BERKAS RAMPUNG: Data telah divalidasi dan diusulkan ke BKN. Silakan pantau penerbitan SK."
    };
  }

  if (diffMonths <= 0) {
    return {
      urgency: "expired",
      urgencyLabel: "Lewat TMT",
      keterangan: "PERINGATAN: TMT sudah terlewati. Segera koordinasikan dengan Bidang Pensiun untuk status SK."
    };
  }
  
  if (diffMonths <= 3) {
    return {
      urgency: "sangat-segera",
      urgencyLabel: "Sangat Segera",
      keterangan: "TINDAKAN CEPAT: Waktu < 3 Bulan. Segera kumpulkan Form DPCP dan lampiran pendukung hari ini."
    };
  }
  
  if (diffMonths <= 6) {
    return {
      urgency: "segera",
      urgencyLabel: "Segera",
      keterangan: "PERSIAPAN: Sisa 4-6 bulan. Harap cek kembali kelengkapan SK Pangkat dan data keluarga di SIASN."
    };
  }

  return {
    urgency: "menunggu",
    urgencyLabel: "Menunggu",
    keterangan: "MONITORING: Dalam periode pemantauan berkas. Pastikan data profil di aplikasi sudah mutakhir."
  };
};

const CSV_DATA = [
  { id: 1,   Nama: "ISKANDAR WAHID, SE",                         NIP: "196811XXXXXXXXXX", Pangkat: "III/d", Jabatan: "KEPALA SEKSI INFORMASI PENCEGAHAN KEBAKARAN",               TMT: "2026-12-01", Unit: "Dinas Kebakaran",                                                  Operator: "IBU IRA"  },
  { id: 2,   Nama: "ROHANI ABD. GAFUR",                          NIP: "196811XXXXXXXXXX", Pangkat: "III/c", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-12-01", Unit: "Puskesmas Siko",                                                   Operator: "IBU IRA"  },
  { id: 3,   Nama: "M ALI, S.Pd",                                NIP: "196604XXXXXXXXXX", Pangkat: "III/d", Jabatan: "Guru Ahli Muda",                                            TMT: "2026-05-01", Unit: "SD Negeri 47 Kota Ternate",                                        Operator: "IBU IRA"  },
  { id: 4,   Nama: "HARYANTO, S.Pd.SD",                          NIP: "196608XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "SMP Negeri 5 Kota Ternate",                                 TMT: "2026-09-01", Unit: "SD NEGERI 3 KOTA TERNATE",                                        Operator: "IBU IRA"  },
  { id: 5,   Nama: "AFIA ESTERLINA PELMELAY, A.Md",              NIP: "196810XXXXXXXXXX", Pangkat: "III/a", Jabatan: "PENGELOLA LAYANAN OPERASIONAL",                             TMT: "2026-11-01", Unit: "Smp Negeri 14 Kota Ternate",                                       Operator: "IBU NAMI" },
  { id: 6,   Nama: "HELIYUSAR KAMARULLAH, S.Pd.",                NIP: "196610XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-11-01", Unit: "SMP NEGERI 6 KOTA TERNATE",                                       Operator: "IBU NAMI" },
  { id: 7,   Nama: "ABIDIN SAMSI",                               NIP: "196811XXXXXXXXXX", Pangkat: "II/d",  Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-12-01", Unit: "Dinas Pendidikan",                                                 Operator: "IBU NAMI" },
  { id: 8,   Nama: "ZAINAB ALI",                                 NIP: "196811XXXXXXXXXX", Pangkat: "III/b", Jabatan: "KEPALA SUB BAGIAN TATA USAHA",                              TMT: "2026-12-01", Unit: "Smp Negeri 6 Kota Ternate",                                        Operator: "IBU NAMI" },
  { id: 9,   Nama: "MAHMUD ADAM",                                NIP: "196810XXXXXXXXXX", Pangkat: "III/b", Jabatan: "SEKRETARIS",                                                 TMT: "2026-11-01", Unit: "Kecamatan Moti",                                                  Operator: "PAK DIKA" },
  { id: 10,  Nama: "YUSUP SALAM",                                NIP: "196810XXXXXXXXXX", Pangkat: "III/a", Jabatan: "SEKRETARIS",                                                 TMT: "2026-11-01", Unit: "Kecamatan Pulau Hiri",                                            Operator: "PAK DIKA" },
  { id: 11,  Nama: "RIFAI HAMISI, SH",                           NIP: "196810XXXXXXXXXX", Pangkat: "III/c", Jabatan: "KEPALA SEKSI PEMERINTAHAN, KETENTRAMAN DAN KETERTIBAN",     TMT: "2026-11-01", Unit: "Kecamatan Pulau Ternate",                                          Operator: "PAK DIKA" },
  { id: 12,  Nama: "BAKAR KASIM",                                NIP: "196802XXXXXXXXXX", Pangkat: "III/d", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-03-01", Unit: "Kecamatan Ternate Barat",                                          Operator: "PAK RAIS" },
  { id: 13,  Nama: "SURIA DUWILA",                               NIP: "196811XXXXXXXXXX", Pangkat: "III/b", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-12-01", Unit: "Bagian Umum",                                                      Operator: "PAK RAIS" },
  { id: 14,  Nama: "SALWIA ANWAR",                               NIP: "196810XXXXXXXXXX", Pangkat: "III/a", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-11-01", Unit: "Sekretariat DPRD",                                                 Operator: "PAK RAIS" },
  { id: 15,  Nama: "MIRNA TJAPALULU",                            NIP: "196805XXXXXXXXXX", Pangkat: "III/d", Jabatan: "PENELAAH TEKNIS KEBIJAKAN",                                 TMT: "2026-06-01", Unit: "Badan Penanggulangan Bencana Daerah",                             Operator: "IBU IRA"  },
  { id: 16,  Nama: "SURYANI HAMZAH, S.Keb",                     NIP: "196808XXXXXXXXXX", Pangkat: "III/d", Jabatan: "Bidan Ahli Muda",                                           TMT: "2026-09-01", Unit: "Puskesmas Jambula",                                               Operator: "IBU IRA"  },
  { id: 17,  Nama: "HAJAR ARSAD, A.Md.Keb",                     NIP: "196809XXXXXXXXXX", Pangkat: "III/c", Jabatan: "Bidan Penyelia",                                            TMT: "2026-10-01", Unit: "Puskesmas Jambula",                                               Operator: "IBU IRA"  },
  { id: 18,  Nama: "MABUD ABAS",                                 NIP: "196712XXXXXXXXXX", Pangkat: "II/d",  Jabatan: "OPERATOR LAYANAN OPERASIONAL",                              TMT: "2027-01-01", Unit: "Dinas Lingkungan Hidup",                                           Operator: "IBU IRA"  },
  { id: 19,  Nama: "NURDIANA USMAN SYAH",                        NIP: "196712XXXXXXXXXX", Pangkat: "III/c", Jabatan: "Analis Kebijakan Ahli Muda",                                TMT: "2027-01-01", Unit: "Dinas Pariwisata",                                                 Operator: "IBU IRA"  },
  { id: 20,  Nama: "RUSNI RAHIM, S.Pd",                          NIP: "196512XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2027-01-01", Unit: "SD NEGERI 4 KOTA TERNATE",                                        Operator: "IBU IRA"  },
  { id: 21,  Nama: "HAYATUDDIN HAMISI, S.Pd",                    NIP: "196601XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-02-01", Unit: "SMP NEGERI 1 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 22,  Nama: "JONI GANI, S.Pd",                            NIP: "196801XXXXXXXXXX", Pangkat: "III/c", Jabatan: "KEPALA SUB BAGIAN TATA USAHA",                              TMT: "2026-02-01", Unit: "Smp Negeri 5 Kota Ternate",                                        Operator: "IBU IRA"  },
  { id: 23,  Nama: "Dra. SUGIARTINI, MM",                        NIP: "196601XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-02-01", Unit: "SMP NEGERI 5 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 24,  Nama: "IBRAHIM ABDULLAH MARSAOLY, S.Pd",            NIP: "196601XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "Guru Ahli Muda",                                            TMT: "2026-02-01", Unit: "SMP NEGERI 7 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 25,  Nama: "SYARIF SAMSUDIN, S.Pd",                      NIP: "196601XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-02-01", Unit: "SMP NEGERI 9 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 26,  Nama: "BIDAHATI ALY, S.PdI",                        NIP: "196601XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-02-01", Unit: "SD NEGERI 29 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 27,  Nama: "HUSEN UMAR, S.Pd",                           NIP: "196601XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "Guru Ahli Muda",                                            TMT: "2026-02-01", Unit: "SD NEGERI 58 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 28,  Nama: "AT SALEH, S.Pd",                             NIP: "196602XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-03-01", Unit: "SD NEGERI 80 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 29,  Nama: "MARDIANA TUNDALI, SE",                       NIP: "196603XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-04-01", Unit: "SMP NEGERI 1 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 30,  Nama: "Dra. ONI LOGAH, M.PdI",                      NIP: "196803XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "KEPALA SATUAN PENDIDIKAN DASAR KEC. KOTA TERNATE SELATAN",  TMT: "2026-04-01", Unit: "Satuan Pendidikan Dasar Kec. Kota Ternate Selatan",                 Operator: "IBU IRA"  },
  { id: 31,  Nama: "SUHARNI BASIR",                              NIP: "196803XXXXXXXXXX", Pangkat: "III/b", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-04-01", Unit: "Satuan Pendidikan Dasar Kec. Kota Ternate Selatan",                 Operator: "IBU IRA"  },
  { id: 32,  Nama: "A RAHMAN JUMATI, S.Pd",                      NIP: "196603XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-04-01", Unit: "SD Negeri 28 Kota Ternate",                                        Operator: "IBU IRA"  },
  { id: 33,  Nama: "FATIMAH USMAN",                              NIP: "196603XXXXXXXXXX", Pangkat: "III/b", Jabatan: "Guru Ahli Pertama",                                          TMT: "2026-04-01", Unit: "SD Negeri 37 Kota Ternate",                                        Operator: "IBU IRA"  },
  { id: 34,  Nama: "SURIYA ABBAS, A.Ma",                         NIP: "196603XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-04-01", Unit: "SD NEGERI 39 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 35,  Nama: "RATNA HI A RAHMAN, S.Pd",                    NIP: "196603XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-04-01", Unit: "SD Negeri 68 Kota Ternate",                                        Operator: "IBU IRA"  },
  { id: 36,  Nama: "SUARDI SOLEMAN",                             NIP: "196803XXXXXXXXXX", Pangkat: "III/d", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-04-01", Unit: "SD NEGERI 73 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 37,  Nama: "SURYANI GARWAN, S.Pd",                       NIP: "196604XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-05-01", Unit: "SMP NEGERI 4 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 38,  Nama: "LAELA SJAMSUDDIN",                           NIP: "196804XXXXXXXXXX", Pangkat: "III/b", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-05-01", Unit: "Smp Negeri 7 Kota Ternate",                                        Operator: "IBU IRA"  },
  { id: 39,  Nama: "RUSTAM ACHMAD HUSAIN, S.Pd",                 NIP: "196604XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-05-01", Unit: "SD NEGERI 42 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 40,  Nama: "RUKIA TAHER, S.Pd",                          NIP: "196604XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-05-01", Unit: "SD NEGERI 45 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 41,  Nama: "FAUJIA NOHO, S.Pd",                          NIP: "196604XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-05-01", Unit: "SD NEGERI 50 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 42,  Nama: "ANI HI MUHAHMMAD, S.Pd.SD",                  NIP: "196604XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-05-01", Unit: "SD Negeri 7 Kota Ternate",                                         Operator: "IBU IRA"  },
  { id: 43,  Nama: "HUSEN NOHO, S.Pd.",                          NIP: "196605XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-06-01", Unit: "SMP NEGERI 3 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 44,  Nama: "NURDIN AHADI, S.Pd",                         NIP: "196605XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-06-01", Unit: "SMP NEGERI 5 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 45,  Nama: "KURAISIA MAHMUD PORA, S.Pd.AUD",             NIP: "196605XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-06-01", Unit: "PAUD PEMBINA 3 KOTA TERNATE",                                     Operator: "IBU IRA"  },
  { id: 46,  Nama: "TAHER KADER, S.PdI",                         NIP: "196605XXXXXXXXXX", Pangkat: "III/b", Jabatan: "Guru Ahli Pertama",                                          TMT: "2026-06-01", Unit: "SD NEGERI 25 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 47,  Nama: "RUGAYA JAFAR, S.Pd",                         NIP: "196605XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-06-01", Unit: "SD NEGERI 45 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 48,  Nama: "JOHRA HI ABD RAHMAN",                        NIP: "196611XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-12-01", Unit: "SMP NEGERI 2 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 49,  Nama: "SITRA HALIL, S.Pd",                          NIP: "196611XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-12-01", Unit: "SD NEGERI 64 KOTA TERNATE",                                       Operator: "IBU IRA"  },
  { id: 50,  Nama: "ANASRIN HI.HAMDJAH, S.IP",                   NIP: "196801XXXXXXXXXX", Pangkat: "III/c", Jabatan: "PENELAAH TEKNIS KEBIJAKAN",                                 TMT: "2026-02-01", Unit: "Badan Pengelolaan Pajak Dan Retribusi Daerah",                     Operator: "IBU NAMI" },
  { id: 51,  Nama: "ALI MUHAMMAD",                               NIP: "196802XXXXXXXXXX", Pangkat: "III/b", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-03-01", Unit: "Badan Pengelolaan Pajak Dan Retribusi Daerah",                     Operator: "IBU NAMI" },
  { id: 52,  Nama: "FAISAL ALBAAR, S.IP",                        NIP: "196805XXXXXXXXXX", Pangkat: "III/c", Jabatan: "PENELAAH TEKNIS KEBIJAKAN",                                 TMT: "2026-06-01", Unit: "Badan Pengelolaan Pajak Dan Retribusi Daerah",                     Operator: "IBU NAMI" },
  { id: 53,  Nama: "AGUS MAHMUD",                                NIP: "196808XXXXXXXXXX", Pangkat: "III/b", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-09-01", Unit: "Badan Pengelolaan Pajak Dan Retribusi Daerah",                     Operator: "IBU NAMI" },
  { id: 54,  Nama: "ALAUDIN MAHMUD",                             NIP: "196809XXXXXXXXXX", Pangkat: "III/a", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-10-01", Unit: "Badan Pengelolaan Pajak Dan Retribusi Daerah",                     Operator: "IBU NAMI" },
  { id: 55,  Nama: "ERRNY TJAN, SE, M.Si",                       NIP: "196809XXXXXXXXXX", Pangkat: "-",     Jabatan: "KEPALA BIDANG EKONOMI DAN SUMBER DAYA ALAM",                TMT: "2026-10-01", Unit: "Badan Perencanaan Pembangunan Penelitian Dan Pengembangan Daerah", Operator: "IBU NAMI" },
  { id: 56,  Nama: "RIDWAN RATMIN, S.Pi",                        NIP: "196810XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "PENATA KELOLA KELAUTAN DAN PERIKANAN",                      TMT: "2026-11-01", Unit: "Dinas Kelautan Dan Perikanan",                                     Operator: "IBU NAMI" },
  { id: 57,  Nama: "SAMIAN FATGEHIPON, S.AP",                    NIP: "196712XXXXXXXXXX", Pangkat: "III/b", Jabatan: "PENELAAH TEKNIS KEBIJAKAN",                                 TMT: "2027-01-01", Unit: "Dinas Kependudukan Dan Pencatatan Sipil",                          Operator: "IBU NAMI" },
  { id: 58,  Nama: "RIMA HARYATI, SH",                           NIP: "196802XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "KEPALA BIDANG PELAYANAN PENDAFTARAN PENDUDUK",              TMT: "2026-03-01", Unit: "Dinas Kependudukan Dan Pencatatan Sipil",                          Operator: "IBU NAMI" },
  { id: 59,  Nama: "MARWA LESTALUHU, A,Md.Kep",                  NIP: "196804XXXXXXXXXX", Pangkat: "III/d", Jabatan: "Perawat Penyelia",                                           TMT: "2026-05-01", Unit: "Puskesmas Kota",                                                  Operator: "IBU NAMI" },
  { id: 60,  Nama: "SITTI SUHAIMI",                              NIP: "196807XXXXXXXXXX", Pangkat: "III/d", Jabatan: "Perawat Penyelia",                                           TMT: "2026-08-01", Unit: "Puskesmas Siko",                                                  Operator: "IBU NAMI" },
  { id: 61,  Nama: "IPSON ARAMUDA, SE., SE.M.Si",                NIP: "196804XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "KEPALA BIDANG PERSANDIAN DAN PENGOLAHAN DATA STATISTIK",    TMT: "2026-05-01", Unit: "Dinas Komunikasi Informatika Dan Persandian",                      Operator: "IBU NAMI" },
  { id: 62,  Nama: "KASMAN TUGUIS",                              NIP: "196803XXXXXXXXXX", Pangkat: "III/a", Jabatan: "OPERATOR LAYANAN OPERASIONAL",                              TMT: "2026-04-01", Unit: "Dinas Lingkungan Hidup",                                           Operator: "IBU NAMI" },
  { id: 63,  Nama: "ISMAD ABDUL KARIM",                          NIP: "196805XXXXXXXXXX", Pangkat: "III/b", Jabatan: "OPERATOR LAYANAN OPERASIONAL",                              TMT: "2026-06-01", Unit: "Dinas Lingkungan Hidup",                                           Operator: "IBU NAMI" },
  { id: 64,  Nama: "FARIDA A SYAH, S.PD",                        NIP: "196806XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "PENELAAH TEKNIS KEBIJAKAN",                                 TMT: "2026-07-01", Unit: "Dinas Pariwisata",                                                 Operator: "IBU NAMI" },
  { id: 65,  Nama: "SETIJA HADI, -, A.Md",                       NIP: "196802XXXXXXXXXX", Pangkat: "III/a", Jabatan: "PENGOLAH DATA DAN INFORMASI",                               TMT: "2026-03-01", Unit: "Dinas Pekerjaan Umum Dan Penataan Ruang",                          Operator: "IBU NAMI" },
  { id: 66,  Nama: "JUDDRA TUHEPALY",                            NIP: "196801XXXXXXXXXX", Pangkat: "III/d", Jabatan: "Penggerak Swadaya Masyarakat Ahli Muda",                    TMT: "2026-02-01", Unit: "Dinas Pemberdayaan Perempuan Dan Perlindungan Anak",               Operator: "IBU NAMI" },
  { id: 67,  Nama: "ASVIRA BEREAMI, SH",                         NIP: "196809XXXXXXXXXX", Pangkat: "III/d", Jabatan: "PENATA KELOLA PEMBERDAYAAN PEREMPUAN DAN PERLINDUNGAN ANAK", TMT: "2026-10-01", Unit: "Dinas Pemberdayaan Perempuan Dan Perlindungan Anak",               Operator: "IBU NAMI" },
  { id: 68,  Nama: "ANSAR HI. USMAN",                            NIP: "196803XXXXXXXXXX", Pangkat: "II/d",  Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-04-01", Unit: "Dinas Penanaman Modal Dan Pelayanan Terpadu Satu Pintu",            Operator: "IBU NAMI" },
  { id: 69,  Nama: "Drs. BAHTIAR TENG",                          NIP: "196605XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "KEPALA DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU", TMT: "2026-06-01", Unit: "Dinas Penanaman Modal Dan Pelayanan Terpadu Satu Pintu",       Operator: "IBU NAMI" },
  { id: 70,  Nama: "ROSMINA ALBAAR, S.Pd",                       NIP: "196512XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2027-01-01", Unit: "SD NEGERI 12 KOTA TERNATE",                                       Operator: "IBU NAMI" },
  { id: 71,  Nama: "SAMSUDIN SALEH",                             NIP: "196512XXXXXXXXXX", Pangkat: "III/c", Jabatan: "Guru Ahli Muda",                                            TMT: "2027-01-01", Unit: "SD NEGERI 74 KOTA TERNATE",                                       Operator: "IBU NAMI" },
  { id: 72,  Nama: "RATNA MUHAMAD",                              NIP: "196805XXXXXXXXXX", Pangkat: "II/d",  Jabatan: "OPERATOR LAYANAN OPERASIONAL",                              TMT: "2026-06-01", Unit: "SD NEGERI 49 KOTA TERNATE",                                       Operator: "IBU NAMI" },
  { id: 73,  Nama: "IDJRINA YUSUF IDRUS",                        NIP: "196806XXXXXXXXXX", Pangkat: "III/a", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-07-01", Unit: "Smp Negeri 7 Kota Ternate",                                        Operator: "IBU NAMI" },
  { id: 74,  Nama: "MAJIDA MAHMUD, S.Pd",                        NIP: "196606XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "Guru Ahli Muda",                                            TMT: "2026-07-01", Unit: "PAUD PEMBINA 12 KOTA TERNATE",                                    Operator: "IBU NAMI" },
  { id: 75,  Nama: "GAFUR U SANGAJI, SST",                       NIP: "196807XXXXXXXXXX", Pangkat: "III/d", Jabatan: "Penyuluh Pertanian Ahli Muda",                              TMT: "2026-08-01", Unit: "Bpp Kecamatan Moti",                                              Operator: "IBU NAMI" },
  { id: 76,  Nama: "MUHLIS SIBUA, S.Sos",                        NIP: "196606XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Pengawas Penyelenggaraan Urusan Pemerintahan Daerah Ahli Madya", TMT: "2026-07-01", Unit: "Inspektorat",                                              Operator: "IBU NAMI" },
  { id: 77,  Nama: "JUNUS YAU, SH, MM",                          NIP: "196801XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "PENELAAH TEKNIS KEBIJAKAN",                                 TMT: "2026-02-01", Unit: "Kecamatan Kota Ternate Selatan",                                  Operator: "IBU NAMI" },
  { id: 78,  Nama: "USMAN NUSA",                                 NIP: "196712XXXXXXXXXX", Pangkat: "II/c",  Jabatan: "PENGELOLA ADMINISTRASI PEMERINTAHAN",                       TMT: "2027-01-01", Unit: "Kecamatan Kota Ternate Utara",                                    Operator: "IBU NAMI" },
  { id: 79,  Nama: "YUNUS HI JAFAR, S.IP",                       NIP: "196804XXXXXXXXXX", Pangkat: "III/d", Jabatan: "KEPALA SEKSI PEMERINTAHAN",                                 TMT: "2026-05-01", Unit: "Kecamatan Pulau Ternate",                                          Operator: "IBU NAMI" },
  { id: 80,  Nama: "ANI NERI",                                   NIP: "196807XXXXXXXXXX", Pangkat: "III/a", Jabatan: "KEPALA SEKSI PEMERINTAHAN, KETENTRAMAN DAN KETERTIBAN",     TMT: "2026-08-01", Unit: "Kecamatan Pulau Ternate",                                          Operator: "IBU NAMI" },
  { id: 81,  Nama: "MOHD. TAUFIK DJAUHAR, SE.M.Si",              NIP: "196602XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "ASISTEN PEREKONOMIAN DAN PEMBANGUNAN",                      TMT: "2026-03-01", Unit: "Sekretariat Daerah",                                               Operator: "IBU NAMI" },
  { id: 82,  Nama: "TAUFIK SUDIN",                               NIP: "196804XXXXXXXXXX", Pangkat: "III/b", Jabatan: "OPERATOR LAYANAN OPERASIONAL",                              TMT: "2026-05-01", Unit: "Bagian Protokoler Komunikasi Pimpinan",                            Operator: "IBU NAMI" },
  { id: 83,  Nama: "RUSNI MUHAMAD SALEH",                        NIP: "196805XXXXXXXXXX", Pangkat: "III/b", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-06-01", Unit: "Sekretariat Daerah",                                               Operator: "IBU NAMI" },
  { id: 84,  Nama: "DRS. SARIF HI SABATUN",                      NIP: "196604XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "STAF AHLI BIDANG EKONOMI, KEUANGAN DAN PEMBANGUNAN",        TMT: "2026-05-01", Unit: "Staf Ahli Bidang Ekonomi, Keuangan Dan Pembangunan",               Operator: "IBU NAMI" },
  { id: 85,  Nama: "Dra. ARDINI RADJILOEN",                      NIP: "196606XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "STAF AHLI BIDANG PEMERINTAHAN, HUKUM DAN POLITIK",           TMT: "2026-07-01", Unit: "Staf Ahli Bidang Pemerintahan, Hukum Dan Politik",                 Operator: "IBU NAMI" },
  { id: 86,  Nama: "MERY TAN",                                   NIP: "196810XXXXXXXXXX", Pangkat: "III/d", Jabatan: "PENGOLAH DATA DAN INFORMASI",                               TMT: "2026-11-01", Unit: "Dinas Kesehatan",                                                 Operator: "PAK DIKA" },
  { id: 87,  Nama: "DIANA KHARIE, SP",                           NIP: "196806XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "KEPALA BIDANG KETERSEDIAAN DAN KERAWANAN PANGAN",           TMT: "2026-07-01", Unit: "Dinas Ketahanan Pangan",                                           Operator: "PAK DIKA" },
  { id: 88,  Nama: "SAID ARSAD DJABAR",                          NIP: "196807XXXXXXXXXX", Pangkat: "III/a", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-08-01", Unit: "Dinas Ketahanan Pangan",                                           Operator: "PAK DIKA" },
  { id: 89,  Nama: "JUHRIA UMAR, S.Pd",                          NIP: "196606XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-07-01", Unit: "SD NEGERI 30 KOTA TERNATE",                                       Operator: "PAK DIKA" },
  { id: 90,  Nama: "JUHU HASAN, S.Pd",                           NIP: "196606XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-07-01", Unit: "SD NEGERI 42 KOTA TERNATE",                                       Operator: "PAK DIKA" },
  { id: 91,  Nama: "NURAIN UMASUGI, S.Pd",                       NIP: "196606XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-07-01", Unit: "SD Negeri 48 Kota Ternate",                                        Operator: "PAK DIKA" },
  { id: 92,  Nama: "LILISURIANI RENTI, S.Pd",                    NIP: "196606XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-07-01", Unit: "SD NEGERI 58 KOTA TERNATE",                                       Operator: "PAK DIKA" },
  { id: 93,  Nama: "GANI FALILA",                                NIP: "196806XXXXXXXXXX", Pangkat: "II/d",  Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-07-01", Unit: "SD NEGERI 72 KOTA TERNATE",                                       Operator: "PAK DIKA" },
  { id: 94,  Nama: "HUSNA NOHO, S.Pd",                           NIP: "196606XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-07-01", Unit: "SD NEGERI 80 KOTA TERNATE",                                       Operator: "PAK DIKA" },
  { id: 95,  Nama: "IKHSAN HUSEN, S.Pd",                         NIP: "196807XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "PENELAAH TEKNIS KEBIJAKAN",                                 TMT: "2026-08-01", Unit: "Dinas Pendidikan",                                                 Operator: "PAK DIKA" },
  { id: 96,  Nama: "NURLIA PANDAWA",                             NIP: "196807XXXXXXXXXX", Pangkat: "III/b", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-08-01", Unit: "Smp Negeri 1 Kota Ternate",                                        Operator: "PAK DIKA" },
  { id: 97,  Nama: "MANSUR YUSUF, S.Pd",                         NIP: "196607XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-08-01", Unit: "SMP NEGERI 3 KOTA TERNATE",                                       Operator: "PAK DIKA" },
  { id: 98,  Nama: "MARYAM BUAMONA, S.Pd",                       NIP: "196607XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-08-01", Unit: "SMP NEGERI 5 KOTA TERNATE",                                       Operator: "PAK DIKA" },
  { id: 99,  Nama: "Dra. EKA WINDAHWATI",                        NIP: "196607XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-08-01", Unit: "SMP NEGERI 7 KOTA TERNATE",                                       Operator: "PAK DIKA" },
  { id: 100, Nama: "HUSNA, S.Pd.",                               NIP: "196607XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-08-01", Unit: "SMP NEGERI 7 KOTA TERNATE",                                       Operator: "PAK DIKA" },
  { id: 101, Nama: "MAR`AN, S.Pd",                               NIP: "196607XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-08-01", Unit: "SD Negeri 63 Kota Ternate",                                        Operator: "PAK DIKA" },
  { id: 102, Nama: "MUHAMMAD ZEN UMAR, S.Pd",                    NIP: "196608XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-09-01", Unit: "SMP NEGERI 3 KOTA TERNATE",                                       Operator: "PAK DIKA" },
  { id: 103, Nama: "SITTI ABDURRAHIM, S.Pd.",                    NIP: "196608XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-09-01", Unit: "SMP NEGERI 7 KOTA TERNATE",                                       Operator: "PAK DIKA" },
  { id: 104, Nama: "ROHANI ISMAIL, S.Pd.AUD",                    NIP: "196608XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-09-01", Unit: "PAUD PEMBINA 2 KOTA TERNATE",                                     Operator: "PAK DIKA" },
  { id: 105, Nama: "HIRJA SAHAFIN",                              NIP: "196808XXXXXXXXXX", Pangkat: "II/c",  Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-09-01", Unit: "SD NEGERI 13 KOTA TERNATE",                                       Operator: "PAK DIKA" },
  { id: 106, Nama: "ISMAIL GOLENG, S.Pd",                        NIP: "196608XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-09-01", Unit: "SD Negeri 24 Kota Ternate",                                        Operator: "PAK DIKA" },
  { id: 107, Nama: "FAHRIA ADAM, S.Pd.I",                        NIP: "196608XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-09-01", Unit: "SD NEGERI 30 KOTA TERNATE",                                       Operator: "PAK DIKA" },
  { id: 108, Nama: "JOHANA RETOB, S.Pd",                         NIP: "196608XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-09-01", Unit: "SD NEGERI 9 KOTA TERNATE",                                        Operator: "PAK DIKA" },
  { id: 109, Nama: "DRS. SUDARMANTO",                            NIP: "196609XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-10-01", Unit: "SMP NEGERI 1 KOTA TERNATE",                                       Operator: "PAK DIKA" },
  { id: 110, Nama: "HADIAH RAJAB, S.Pd",                         NIP: "196609XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-10-01", Unit: "SMP NEGERI 4 KOTA TERNATE",                                       Operator: "PAK DIKA" },
  { id: 111, Nama: "IAM MUHAMAD, S.Pd",                          NIP: "196609XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-10-01", Unit: "PAUD PEMBINA 3 KOTA TERNATE",                                     Operator: "PAK DIKA" },
  { id: 112, Nama: "EDNAH TAIL",                                 NIP: "196609XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-10-01", Unit: "SD NEGERI 11 KOTA TERNATE",                                       Operator: "PAK DIKA" },
  { id: 113, Nama: "AISYA DJAFAR, S.Pd",                         NIP: "196609XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-10-01", Unit: "SD Negeri 20 Kota Ternate",                                        Operator: "PAK DIKA" },
  { id: 114, Nama: "UYUN ABDULLAH, S.Pd",                        NIP: "196609XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-10-01", Unit: "SD Negeri 23 Kota Ternate",                                        Operator: "PAK DIKA" },
  { id: 115, Nama: "AFIAT AYUB WAHAB, S.Pd",                     NIP: "196609XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-10-01", Unit: "SD Negeri 37 Kota Ternate",                                        Operator: "PAK DIKA" },
  { id: 116, Nama: "SAFIA AHMAD, A.Ma, S.PdI",                   NIP: "196609XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-10-01", Unit: "SD NEGERI 49 KOTA TERNATE",                                       Operator: "PAK DIKA" },
  { id: 117, Nama: "EMELIA IDRUS",                               NIP: "196609XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-10-01", Unit: "SD Negeri 51 Kota Ternate",                                        Operator: "PAK DIKA" },
  { id: 118, Nama: "ROCHANI KAMARULLAH, S.Pd.SD",                NIP: "196609XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-10-01", Unit: "SD Negeri 68 Kota Ternate",                                        Operator: "PAK DIKA" },
  { id: 119, Nama: "WAHAD KAIDATI, S.Sos",                       NIP: "196712XXXXXXXXXX", Pangkat: "III/d", Jabatan: "KEPALA BIDANG PENEGAKAN PERUNDANG-UNDANGAN DAERAH",          TMT: "2027-01-01", Unit: "Satuan Polisi Pamong Praja",                                       Operator: "PAK DIKA", StatusPensiun: "MD" },
  { id: 120, Nama: "TOTO SUKAMTO, S.Sos",                        NIP: "196805XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "SEKRETARIS",                                                 TMT: "2026-06-01", Unit: "Satuan Polisi Pamong Praja",                                       Operator: "PAK DIKA" },
  { id: 121, Nama: "RAMLA HAJI ABDULLAH, A.Md.AK",               NIP: "196808XXXXXXXXXX", Pangkat: "III/d", Jabatan: "Analis Kebijakan Ahli Muda",                                TMT: "2026-09-01", Unit: "Sekretariat DPRD",                                                 Operator: "PAK DIKA" },
  { id: 122, Nama: "DAHLAN HASAN, S.Sos",                        NIP: "196712XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "PENELAAH TEKNIS KEBIJAKAN",                                 TMT: "2027-01-01", Unit: "Badan Kesatuan Bangsa Dan Politik",                                Operator: "PAK RAIS", StatusPensiun: "MD" },
  { id: 123, Nama: "AISAH SIRADJU, S.A.P.",                      NIP: "196810XXXXXXXXXX", Pangkat: "III/d", Jabatan: "PENELAAH TEKNIS KEBIJAKAN",                                 TMT: "2026-11-01", Unit: "Badan Pengelolaan Pajak Dan Retribusi Daerah",                     Operator: "PAK RAIS" },
  { id: 124, Nama: "HARSONO, S.Pd",                              NIP: "196512XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2027-01-01", Unit: "SMP NEGERI 2 KOTA TERNATE",                                       Operator: "PAK RAIS", StatusPensiun: "MD" },
  { id: 125, Nama: "MAN MUSA, S.Pd.I",                           NIP: "196512XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2027-01-01", Unit: "SD Negeri 23 Kota Ternate",                                        Operator: "PAK RAIS", StatusPensiun: "MD" },
  { id: 126, Nama: "ACIA TAHER, S.Pd",                           NIP: "196512XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Guru Ahli Madya",                                           TMT: "2027-01-01", Unit: "SD NEGERI 29 KOTA TERNATE",                                       Operator: "PAK RAIS", StatusPensiun: "MD" },
  { id: 127, Nama: "AISAH MUSA, S.Pd",                           NIP: "196609XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-10-01", Unit: "SD NEGERI 69 KOTA TERNATE",                                       Operator: "PAK RAIS" },
  { id: 128, Nama: "AMINAH UMAR, S.Pd",                          NIP: "196610XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "Guru Ahli Madya",                                           TMT: "2026-11-01", Unit: "SD NEGERI 1 KOTA TERNATE",                                        Operator: "PAK RAIS" },
  { id: 129, Nama: "NURAINI DJUMATI, SE",                        NIP: "196804XXXXXXXXXX", Pangkat: "III/d", Jabatan: "Penata Kependudukan dan Keluarga Berencana Ahli Muda",       TMT: "2026-05-01", Unit: "Dinas Pengendalian Penduduk Dan Keluarga Berencana",               Operator: "PAK RAIS" },
  { id: 130, Nama: "ENDANG HARTATI NOCHO DJAFAAR",               NIP: "196805XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "PENELAAH TEKNIS KEBIJAKAN",                                 TMT: "2026-06-01", Unit: "Dinas Perindustrian Dan Perdagangan",                              Operator: "PAK RAIS" },
  { id: 131, Nama: "HASAN ADAM, SE",                             NIP: "196809XXXXXXXXXX", Pangkat: "III/d", Jabatan: "PENELAAH TEKNIS KEBIJAKAN",                                 TMT: "2026-10-01", Unit: "Dinas Perindustrian Dan Perdagangan",                              Operator: "PAK RAIS" },
  { id: 132, Nama: "HAPSA RASIDIN",                              NIP: "196802XXXXXXXXXX", Pangkat: "III/d", Jabatan: "Arsiparis Ahli Muda",                                        TMT: "2026-03-01", Unit: "Dinas Perpustakaan Dan Kearsipan Daerah",                          Operator: "PAK RAIS" },
  { id: 133, Nama: "MINARNI MOHAMMAD SALEH, SH",                 NIP: "196808XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "KEPALA BIDANG PELESTARIAN DAN ALIH MEDIA",                  TMT: "2026-09-01", Unit: "Dinas Perpustakaan Dan Kearsipan Daerah",                          Operator: "PAK RAIS" },
  { id: 134, Nama: "MEGAH MULTINIWATI EDA, SP",                  NIP: "196806XXXXXXXXXX", Pangkat: "III/d", Jabatan: "PENELAAH TEKNIS KEBIJAKAN",                                 TMT: "2026-07-01", Unit: "Dinas Pertanian",                                                  Operator: "PAK RAIS" },
  { id: 135, Nama: "SUHARNO, SP, SP.MM",                         NIP: "196808XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "PENATA LAYANAN OPERASIONAL",                                TMT: "2026-09-01", Unit: "Dinas Pertanian",                                                  Operator: "PAK RAIS" },
  { id: 136, Nama: "NIKEN KUSTINAH IRIANI",                      NIP: "196806XXXXXXXXXX", Pangkat: "III/a", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-07-01", Unit: "Dinas Tenaga Kerja",                                               Operator: "PAK RAIS" },
  { id: 137, Nama: "ROHANI PANJAB MAHLI, SH",                    NIP: "196610XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "Pengawas Penyelenggaraan Urusan Pemerintahan Daerah Ahli Madya", TMT: "2026-11-01", Unit: "Inspektorat",                                              Operator: "PAK RAIS" },
  { id: 138, Nama: "HARITSAH RUSLY TOTOU, S.Pd",                 NIP: "196803XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "PENELAAH TEKNIS KEBIJAKAN",                                 TMT: "2026-04-01", Unit: "Kecamatan Kota Ternate Selatan",                                  Operator: "PAK RAIS" },
  { id: 139, Nama: "MUHSIN BIN SYEH ABUBAKAR, SP.M.Si",          NIP: "196803XXXXXXXXXX", Pangkat: "IV/b",  Jabatan: "PENELAAH TEKNIS KEBIJAKAN",                                 TMT: "2026-04-01", Unit: "Kecamatan Kota Ternate Selatan",                                  Operator: "PAK RAIS" },
  { id: 140, Nama: "BUSTAMI SUNYA, S.IP",                        NIP: "196804XXXXXXXXXX", Pangkat: "IV/a",  Jabatan: "PENELAAH TEKNIS KEBIJAKAN",                                 TMT: "2026-05-01", Unit: "Kecamatan Kota Ternate Selatan",                                  Operator: "PAK RAIS" },
  { id: 141, Nama: "AMIL ISMAIL",                                NIP: "196807XXXXXXXXXX", Pangkat: "III/c", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-08-01", Unit: "Kecamatan Kota Ternate Selatan",                                  Operator: "PAK RAIS" },
  { id: 142, Nama: "GAZALI ABDUL RACHMAN, SH",                   NIP: "196808XXXXXXXXXX", Pangkat: "III/d", Jabatan: "KEPALA SEKSI PEMBANGUNAN DAN PEMBERDAYAAN MASYARAKAT",       TMT: "2026-09-01", Unit: "Kecamatan Kota Ternate Selatan",                                  Operator: "PAK RAIS" },
  { id: 143, Nama: "DAMIR MUSTAFA",                              NIP: "196803XXXXXXXXXX", Pangkat: "III/b", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-04-01", Unit: "Kecamatan Kota Ternate Tengah",                                   Operator: "PAK RAIS" },
  { id: 144, Nama: "JUNITA BIAN",                                NIP: "196806XXXXXXXXXX", Pangkat: "III/c", Jabatan: "SEKRETARIS",                                                 TMT: "2026-07-01", Unit: "Kecamatan Kota Ternate Tengah",                                   Operator: "PAK RAIS" },
  { id: 145, Nama: "FAUZIAH ALI SIDIK",                          NIP: "196807XXXXXXXXXX", Pangkat: "III/a", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-08-01", Unit: "Kecamatan Kota Ternate Tengah",                                   Operator: "PAK RAIS" },
  { id: 146, Nama: "NORMA MENER",                                NIP: "196801XXXXXXXXXX", Pangkat: "III/d", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-02-01", Unit: "Kecamatan Kota Ternate Utara",                                    Operator: "PAK RAIS" },
  { id: 147, Nama: "RUSTAM KHARIE, ST",                          NIP: "196802XXXXXXXXXX", Pangkat: "III/d", Jabatan: "SEKRETARIS",                                                 TMT: "2026-03-01", Unit: "Kecamatan Kota Ternate Utara",                                    Operator: "PAK RAIS" },
  { id: 148, Nama: "SALIM FALILA",                               NIP: "196802XXXXXXXXXX", Pangkat: "III/a", Jabatan: "KEPALA SEKSI PEMERINTAHAN, KETENTRAMAN DAN KETERTIBAN",     TMT: "2026-03-01", Unit: "Kecamatan Kota Ternate Utara",                                    Operator: "PAK RAIS" },
  { id: 149, Nama: "RAMLAN UMAR",                                NIP: "196805XXXXXXXXXX", Pangkat: "III/a", Jabatan: "KEPALA SEKSI PEMBANGUNAN DAN PEMBERDAYAAN MASYARAKAT",       TMT: "2026-06-01", Unit: "Kecamatan Kota Ternate Utara",                                    Operator: "PAK RAIS" },
  { id: 150, Nama: "FARUK ALBAAR, SE.M.Si",                      NIP: "196808XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "PENELAAH TEKNIS KEBIJAKAN",                                 TMT: "2026-09-01", Unit: "Kecamatan Kota Ternate Utara",                                    Operator: "PAK RAIS" },
  { id: 151, Nama: "HAMZAH A. DARAMAN",                          NIP: "196808XXXXXXXXXX", Pangkat: "III/a", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-09-01", Unit: "Kecamatan Kota Ternate Utara",                                    Operator: "PAK RAIS" },
  { id: 152, Nama: "DENTI MAHIBU",                               NIP: "196806XXXXXXXXXX", Pangkat: "II/a",  Jabatan: "PENGADMINISTRASI UMUM",                                     TMT: "2026-07-01", Unit: "Kecamatan Pulau Batang Dua",                                       Operator: "PAK RAIS" },
  { id: 153, Nama: "JAHRA MARDJUN",                              NIP: "196802XXXXXXXXXX", Pangkat: "III/d", Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-03-01", Unit: "Kecamatan Pulau Hiri",                                              Operator: "PAK RAIS" },
  { id: 154, Nama: "MANSUR ISHAK, SST",                          NIP: "196804XXXXXXXXXX", Pangkat: "III/a", Jabatan: "SEKRETARIS",                                                 TMT: "2026-05-01", Unit: "Kecamatan Pulau Hiri",                                              Operator: "PAK RAIS" },
  { id: 155, Nama: "ABD. KADER RAKIB, S.Sos",                    NIP: "196805XXXXXXXXXX", Pangkat: "III/c", Jabatan: "KEPALA SEKSI PEMBANGUNAN DAN PEMBERDAYAAN MASYARAKAT",       TMT: "2026-06-01", Unit: "Kecamatan Pulau Hiri",                                              Operator: "PAK RAIS" },
  { id: 156, Nama: "RUSLAN BAKAR",                               NIP: "196806XXXXXXXXXX", Pangkat: "II/d",  Jabatan: "PENGADMINISTRASI PERKANTORAN",                              TMT: "2026-07-01", Unit: "Kecamatan Pulau Hiri",                                              Operator: "PAK RAIS" },
  { id: 157, Nama: "ANAS, S.Pd., MM.Par",                        NIP: "196712XXXXXXXXXX", Pangkat: "IV/c",  Jabatan: "PENELAAH TEKNIS KEBIJAKAN",                                 TMT: "2027-01-01", Unit: "Bagian Organisasi",                                                Operator: "PAK RAIS", StatusPensiun: "MD" },
];

const App = () => {
  const [activeTab, setActiveTab] = useState('monitoring');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [csvData, setCsvData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState('');

  // Load CSV data on mount
  useEffect(() => {
    loadCSVData().then(data => {
      setCsvData(data);
      setLoading(false);
    });
  }, []);

  const [dataPegawai, setDataPegawai] = useState(() => {
    try {
      const saved = localStorage.getItem('pegawaiStatus');
      const statusMap = saved ? JSON.parse(saved) : {};
      return CSV_DATA.map(d => ({ ...d, Status: statusMap[d.id] ?? 'Pending' }));
    } catch {
      return CSV_DATA.map(d => ({ ...d, Status: 'Pending' }));
    }
  });

  // Update data when CSV data loads
  useEffect(() => {
    if (csvData) {
      try {
        const saved = localStorage.getItem('pegawaiStatus');
        const map = saved ? JSON.parse(saved) : {};
        setDataPegawai(csvData.map(d => ({ ...d, Status: map[d.id] ?? 'Pending' })));
      } catch { setDataPegawai(csvData.map(d => ({ ...d, Status: 'Pending' }))); }
    }
  }, [csvData]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    try {
      const map = Object.fromEntries(dataPegawai.map(d => [d.id, d.Status]));
      localStorage.setItem('pegawaiStatus', JSON.stringify(map));
    } catch { /* storage unavailable */ }
  }, [dataPegawai]);

  const processedData = useMemo(() => {
    return dataPegawai.map(item => ({
      ...item,
      ...getStatusDetail(item)
    })).sort((a, b) => a.id - b.id);
  }, [dataPegawai]);

  const filteredData = useMemo(() =>
    processedData.filter(item => {
      const matchesSearch = item.Nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.NIP.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' ||
        (item.StatusPensiun || 'BUP') === statusFilter;
      return matchesSearch && matchesStatus;
    }),
    [processedData, searchTerm, statusFilter]
  );

  const toggleStatus = (id) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    setDataPegawai(prev => prev.map(p =>
      p.id === id ? { ...p, Status: p.Status === 'Done' ? 'Pending' : 'Done' } : p
    ));
  };

  // Login handler
  const handleLogin = (username, password) => {
    const user = USERS[username];
    if (user && user.password === password) {
      setCurrentUser({ username, ...user });
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Username atau password salah');
    }
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  // Show login page if not authenticated
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} error={loginError} darkMode={darkMode} />;
  }

  const isAdmin = currentUser?.role === 'admin';

  const exportData = () => {
    const headers = ['No', 'NIP', 'Nama', 'Pangkat', 'Jabatan', 'Unit Kerja', 'TMT', 'Status Pensiun', 'Status Monitoring', 'Urgensi'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(p => [
        p.id,
        `"${p.NIP}"`,
        `"${p.Nama}"`,
        `"${p.Pangkat}"`,
        `"${p.Jabatan}"`,
        `"${p.Unit}"`,
        p.TMT,
        p.StatusPensiun || 'BUP',
        p.Status === 'Done' ? 'Selesai' : 'Pending',
        p.urgencyLabel
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sipensi_monitoring_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-[#0b1120] text-slate-100' : 'bg-[#f8fafc] text-slate-900'} transition-all`}>

      {/* SIDEBAR */}
      <aside className={`fixed top-0 left-0 h-screen z-50 transition-all border-r shadow-2xl overflow-hidden
        ${isSidebarOpen ? 'w-72' : 'w-0 -translate-x-full'}
        ${darkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'}`}>

        <div className="p-8 border-b dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">S</div>
          <div>
            <h1 className="text-xl font-black text-indigo-600 tracking-tighter italic">SIPENSI</h1>
            <p className="text-[8px] uppercase font-bold text-slate-400 tracking-widest">Sitem Informasi & Monitoring Data Pensiun</p>
          </div>
        </div>

        <nav className="p-6 space-y-3">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} /> <span className="text-sm font-black">Statistik Terkini</span>
          </button>
          <button onClick={() => setActiveTab('monitoring')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'monitoring' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <Users size={20} /> <span className="text-sm font-black">Database {processedData.length} Pegawai</span>
          </button>
        </nav>

        <div className="absolute bottom-10 left-0 w-full px-8">
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              {isAdmin ? <ShieldCheck size={20} /> : <Users size={20} />}
              <p className="text-[10px] font-black uppercase tracking-widest">{isAdmin ? 'Administrator' : 'Petugas Monitoring'}</p>
            </div>
            <p className="text-xs font-bold leading-relaxed opacity-80 italic">{currentUser?.name} - {processedData.length} pegawai.</p>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className={`flex-1 p-6 md:p-10 transition-all ${isSidebarOpen ? 'ml-72' : 'ml-0'}`}>

        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-4 rounded-2xl border shadow-sm transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-indigo-400' : 'bg-white border-slate-200 text-indigo-600'}`}>
              {isSidebarOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
            </button>
            <div>
              <h2 className="text-4xl font-black tracking-tight">Data Pensiun 2026</h2>
              <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Monitoring Data 1-{processedData.length} Pegawai</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdmin ? 'bg-indigo-600' : 'bg-emerald-500'}`}>
                {isAdmin ? <ShieldCheck size={16} className="text-white" /> : <Users size={16} className="text-white" />}
              </div>
              <div className="text-left">
                <p className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{currentUser?.name}</p>
                <p className={`text-[10px] font-bold ${isAdmin ? 'text-indigo-400' : 'text-emerald-500'}`}>
                  {isAdmin ? 'Administrator' : 'Petugas'}
                </p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-4 rounded-2xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:bg-red-50 dark:hover:bg-red-900/20 group">
              <LogOut size={20} className="text-slate-400 group-hover:text-red-500" />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-4 rounded-2xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm transition-all">
              {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-600" />}
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <StatCard label="Total Database"  val={processedData.length}                                                            icon={<Users size={28} />}         color="indigo"  />
            <StatCard label="BUP (Batas Usia Pensiun)"  val={processedData.filter(d => (d.StatusPensiun || 'BUP') === 'BUP').length}                           icon={<CheckCircle2 size={28} />}   color="blue" />
            <StatCard label="MD (Meninggal Dunia)"   val={processedData.filter(d => (d.StatusPensiun || 'BUP') === 'MD').length}                           icon={<Clock size={28} />}          color="red"   />
            <StatCard label="Berkas Selesai"  val={processedData.filter(d => d.Status === 'Done').length}                           icon={<CheckCircle2 size={28} />}   color="emerald" />
            <StatCard label="Belum Selesai"   val={processedData.filter(d => d.Status !== 'Done').length}                           icon={<Clock size={28} />}          color="amber"   />
            <StatCard label="Urgent (<3bln)"  val={processedData.filter(d => d.urgency === 'sangat-segera' && d.Status !== 'Done').length} icon={<AlertTriangle size={28} />} color="rose" />
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`p-10 rounded-[3rem] border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-2xl shadow-indigo-100/20'}`}>
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-8">
                <div>
                  <h3 className="text-2xl font-black">Data Lengkap 1-{processedData.length}</h3>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-tighter mt-1 italic">Seluruh data dari file CSV telah dimuat</p>
                </div>
                <div className="flex gap-3 flex-wrap xl:flex-nowrap">
                  <div className="relative w-full xl:w-[350px]">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      placeholder="Cari Nama Pegawai atau NIP..."
                      className="pl-14 pr-6 py-5 rounded-3xl border w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-indigo-500/20 font-black text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="relative w-full xl:w-[200px]">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-6 pr-6 py-5 rounded-3xl border w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-indigo-500/20 font-black text-sm appearance-none cursor-pointer"
                    >
                      <option value="all">Semua Jenis</option>
                      <option value="BUP">BUP (Batas Usia Pensiun)</option>
                      <option value="MD">MD (Meninggal Dunia)</option>
                    </select>
                  </div>
                  <button
                    onClick={exportData}
                    className="flex items-center gap-2 px-6 py-5 rounded-3xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition-all shadow-lg"
                  >
                    <Download size={20} />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-[2rem] border dark:border-slate-700">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-[11px] font-black uppercase text-slate-400 tracking-widest">
                    <tr>
                      <th className="py-7 px-8 text-center w-16">No</th>
                      <th className="py-7 px-6">NIP</th>
                      <th className="py-7 px-6">Nama Pegawai / Pangkat</th>
                      <th className="py-7 px-6">Status Pensiun</th>
                      <th className="py-7 px-6">Unit / TMT</th>
                      {isAdmin && (
                        <th className="py-7 px-6">Croscheck Keterangan</th>
                      )}
                      <th className="py-7 px-6 text-center">Urgensi</th>
                      {isAdmin && (
                        <th className="py-7 px-6 text-center">Aksi</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-700">
                    {filteredData.map((pns) => (
                      <tr key={pns.id} className="group hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all">
                        <td className="py-7 px-8 text-center font-black text-slate-300 group-hover:text-indigo-600 transition-colors">
                          {pns.id}
                        </td>
                        <td className="py-7 px-8 text-center">
                          <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md">
                            {pns.NIP}
                          </span>
                        </td>
                        <td className="py-7 px-8">
                          <p className="font-black text-sm text-indigo-700 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">{pns.Nama}</p>
                          <p className="text-[10px] text-slate-400 font-mono font-bold mt-1 bg-slate-100 dark:bg-slate-800 inline-block px-2 py-0.5 rounded-md">{pns.Pangkat} · {pns.Jabatan}</p>
                        </td>
                        <td className="py-7 px-8 text-center">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                            pns.StatusPensiun === 'MD'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {pns.StatusPensiun === 'MD' ? 'Meninggal Dunia' : 'Batas Usia Pensiun'}
                          </span>
                        </td>
                        <td className="py-7 px-8">
                          <p className="text-[10px] font-black uppercase text-slate-500 mb-1 leading-tight">{pns.Unit}</p>
                          <div className="flex items-center gap-2 text-indigo-500 font-bold text-[10px]">
                            <Clock size={12} /> {pns.TMT}
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="py-7 px-8">
                            <div className={`p-4 rounded-2xl border flex gap-3 max-w-sm ${pns.Status === 'Done' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                              <Info size={16} className={`flex-shrink-0 mt-0.5 ${pns.Status === 'Done' ? 'text-emerald-500' : 'text-indigo-500'}`} />
                              <p className={`text-[11px] font-bold leading-relaxed ${pns.Status === 'Done' ? 'text-emerald-700' : 'text-slate-500'}`}>
                                {pns.keterangan}
                              </p>
                            </div>
                          </td>
                        )}
                        <td className="py-7 px-8 text-center">
                          <StatusBadge type={pns.urgency} label={pns.urgencyLabel} />
                        </td>
                        {isAdmin && (
                          <td className="py-7 px-8 text-center">
                            <button
                              onClick={() => toggleStatus(pns.id)}
                              className={`p-4 rounded-2xl transition-all shadow-lg ${pns.Status === 'Done' ? 'bg-emerald-600 text-white hover:scale-105' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-indigo-600 hover:bg-white'}`}
                            >
                              <ClipboardCheck size={22} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Login Component
const LoginPage = ({ onLogin, error, darkMode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${darkMode ? 'bg-[#0b1120]' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'}`}>
      <div className={`w-full max-w-md p-10 rounded-[3rem] shadow-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl mx-auto mb-6">
            S
          </div>
          <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>SIPENSI</h1>
          <p className={`text-sm font-bold mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sistem Informasi Monitoring Data Pensiun</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-xs font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-6 py-4 rounded-2xl border text-sm font-bold ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} focus:ring-4 focus:ring-indigo-500/20`}
              placeholder="Masukkan username"
              required
            />
          </div>

          <div>
            <label className={`block text-xs font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-6 py-4 rounded-2xl border text-sm font-bold ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} focus:ring-4 focus:ring-indigo-500/20 pr-14`}
                placeholder="Masukkan password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}
              >
                {showPassword ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
              <p className="text-red-600 text-xs font-bold text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            MASUK
          </button>
        </form>

        <div className={`mt-8 p-4 rounded-2xl ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
          <p className={`text-xs font-bold text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-3`}>Demo Credentials</p>
          <div className="space-y-2 text-xs">
            <div className={`flex justify-between p-2 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <span className={darkMode ? 'text-indigo-400' : 'text-indigo-600'}>Admin:</span>
              <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>admin / admin123</span>
            </div>
            <div className={`flex justify-between p-2 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-white'} border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <span className={darkMode ? 'text-indigo-400' : 'text-indigo-600'}>User:</span>
              <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>user / user123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, val, icon, color }) => {
  const colors = {
    indigo: 'text-indigo-600',
    blue: 'text-blue-600',
    red: 'text-red-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600'
  };
  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border dark:border-slate-700 shadow-xl flex items-center gap-8 group hover:border-indigo-500 transition-all">
      <div className={`w-16 h-16 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black mt-1 tracking-tighter">{val}</p>
      </div>
    </div>
  );
};

const StatusBadge = ({ type, label }) => {
  const styles = {
    'sangat-segera': 'bg-rose-500 text-white shadow-rose-200',
    'segera':        'bg-amber-400 text-white shadow-amber-200',
    'menunggu':      'bg-indigo-500 text-white shadow-indigo-200',
    'done':          'bg-emerald-500 text-white shadow-emerald-200',
    'expired':       'bg-slate-800 text-white shadow-slate-200'
  };
  return (
    <span className={`inline-flex items-center justify-center px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${styles[type]}`}>
      {label}
    </span>
  );
};

export default App;
