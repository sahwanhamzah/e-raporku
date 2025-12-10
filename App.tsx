import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Download,
  Upload,
  Camera,
  Trash2,
  Plus
} from 'lucide-react';
import { 
  ReportData, 
  DevelopmentLevel, 
  CharacterScore, 
  CPPAItem,
  DailyActivity,
  HealthData
} from './types';
import { generateReportNarrative } from './services/geminiService';
import { SectionWrapper } from './components/SectionWrapper';

// --- Initial Data Constants ---
const INITIAL_CPPA: CPPAItem[] = [
  { id: '1', scope: 'Nilai Agama & Budi Pekerti', description: 'Mengenal Allah, berdoa, perilaku jujur & sopan', level: DevelopmentLevel.BSH },
  { id: '2', scope: 'Fisik Motorik', description: 'Motorik kasar (berlari, melompat) & halus (menulis, menggambar)', level: DevelopmentLevel.BSH },
  { id: '3', scope: 'Kognitif', description: 'Pemecahan masalah, berpikir logis, mengenal angka & pola', level: DevelopmentLevel.MB },
  { id: '4', scope: 'Bahasa', description: 'Memahami bahasa reseptif & ekspresif, keaksaraan awal', level: DevelopmentLevel.BSH },
  { id: '5', scope: 'Sosial Emosional', description: 'Kesadaran diri, tanggung jawab, perilaku prososial', level: DevelopmentLevel.BSB },
  { id: '6', scope: 'Seni', description: 'Mengekspresikan diri melalui karya seni & musik', level: DevelopmentLevel.MB },
];

const INITIAL_CHARACTER = [
  { id: 'c1', aspect: 'Sikap Spiritual (Ketaatan Beribadah)', score: CharacterScore.B },
  { id: 'c2', aspect: 'Sikap Sosial (Kepedulian Teman)', score: CharacterScore.SB },
  { id: 'c3', aspect: 'Kepemimpinan Kecil', score: CharacterScore.B },
  { id: 'c4', aspect: 'Tanggung Jawab', score: CharacterScore.B },
  { id: 'c5', aspect: 'Kemandirian', score: CharacterScore.SB },
  { id: 'c6', aspect: 'Kerjasama', score: CharacterScore.B },
];

const INITIAL_DATA: ReportData = {
  student: {
    name: 'Muhammad Fatih Al-Farisi',
    nis: '2024001',
    dob: 'Jatisela, 12 Mei 2019',
    parentName: '..............................',
    address: 'Jl. Merpati No. 10, Jatisela',
    academicYear: '2024/2025',
    semester: 'Ganjil',
    group: 'B (Usia 5-6 Tahun)',
    photoUrl: ''
  },
  health: {
    weight: '18',
    height: '110',
    headCircumference: '50',
    eyes: 'Normal',
    ears: 'Normal',
    teeth: 'Bersih/Sehat'
  },
  cppa: INITIAL_CPPA,
  dailyActivities: [
    { id: 'd1', activity: 'Sholat Dhuha Berjamaah', indicator: 'Mampu mengikuti gerakan sholat', grade: 'A', note: 'Sangat khusyuk' },
    { id: 'd2', activity: 'Proyek Menanam Biji Kacang', indicator: 'Mengamati pertumbuhan tanaman', grade: 'B', note: 'Antusias menyiram' },
  ],
  character: INITIAL_CHARACTER,
  attendance: { present: 85, sick: 2, permission: 1, alpha: 0 },
  extras: [
    { id: 'e1', name: 'Tahfidz Qur\'an', grade: 'A', note: 'Hafal An-Nas sampai Al-Fil' }
  ],
  narrative: '',
  teacherNote: '',
  principalName: 'Murti Asani, S.Pd',
  teacherName: 'Sri Anita Dewi Sinta, A.Md',
  date: new Date().toISOString().split('T')[0],
  place: 'Jatisela'
};

// Component for Autosizing Text in Print (Large Blocks)
const EditableText: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  minHeight?: string;
}> = ({ value, onChange, placeholder, minHeight = '150px' }) => {
  return (
    <>
      <textarea 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full bg-transparent outline-none resize-none whitespace-pre-wrap print:hidden input-area"
        style={{ minHeight }}
        placeholder={placeholder}
      />
      <div className="hidden print:block whitespace-pre-wrap text-justify leading-relaxed print-view" style={{ minHeight }}>
        {value || <span className="text-transparent">.</span>}
      </div>
    </>
  );
};

// Component for Table Cell Text (Auto-expanding, wraps text)
const TableText: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  center?: boolean;
}> = ({ value, onChange, placeholder, center }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-transparent outline-none resize-none overflow-hidden p-2 print:hidden input-area ${center ? 'text-center' : 'text-left'}`}
        rows={1}
        placeholder={placeholder}
        style={{ minHeight: '2.5rem' }} 
      />
      <div className={`hidden print:block whitespace-pre-wrap p-2 leading-snug print-view ${center ? 'text-center' : 'text-left'}`}>
        {value}
      </div>
    </>
  );
};

const App: React.FC = () => {
  const [data, setData] = useState<ReportData>(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = `Rapor_${data.student.name.replace(/\s+/g, '_')}_${data.student.semester}`;
  }, [data.student.name, data.student.semester]);

  // --- Handlers ---
  const handleStudentChange = (field: keyof typeof data.student, value: string) => {
    setData(prev => ({ ...prev, student: { ...prev.student, [field]: value } }));
  };
  const handleHealthChange = (field: keyof HealthData, value: string) => {
    setData(prev => ({ ...prev, health: { ...prev.health, [field]: value } }));
  };
  const handleCPPAChange = (id: string, level: DevelopmentLevel) => {
    setData(prev => ({ ...prev, cppa: prev.cppa.map(item => item.id === id ? { ...item, level } : item) }));
  };
  const handleDailyChange = (id: string, field: keyof DailyActivity, value: string) => {
    setData(prev => ({ ...prev, dailyActivities: prev.dailyActivities.map(item => item.id === id ? { ...item, [field]: value } : item) }));
  };
  const addDailyActivity = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setData(prev => ({ ...prev, dailyActivities: [...prev.dailyActivities, { id: newId, activity: '', indicator: '', grade: 'B', note: '' }] }));
  };
  const removeDailyActivity = (id: string) => {
    setData(prev => ({ ...prev, dailyActivities: prev.dailyActivities.filter(item => item.id !== id) }));
  };
  const handleCharacterChange = (id: string, score: CharacterScore) => {
    setData(prev => ({ ...prev, character: prev.character.map(item => item.id === id ? { ...item, score } : item) }));
  };
  const handleAiGenerate = async () => {
    if (!process.env.API_KEY) { alert("API Key belum diset!"); return; }
    setIsGenerating(true); setError(null);
    try {
      const result = await generateReportNarrative(data);
      setData(prev => ({ ...prev, narrative: result.narrative, teacherNote: result.teacherNote }));
    } catch (e) { setError("Gagal menghasilkan narasi."); } finally { setIsGenerating(false); }
  };

  // HTML2PDF Logic
  const handleDownloadPDF = async () => {
    setIsPdfGenerating(true);
    // Allow React to re-render with pdf-generating class and hide buttons
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const element = document.querySelector('.print-container');
    const opt = {
      // Standard A4 Margins: Top: 20mm, Right: 15mm, Bottom: 20mm, Left: 25mm
      margin: [20, 23, 21, 15], 
      filename: `Rapor_${data.student.name.replace(/\s+/g, '_')}_${data.student.semester}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] } 
    };

    try {
        // @ts-ignore
        if (window.html2pdf) {
            // @ts-ignore
            await window.html2pdf().set(opt).from(element).save();
        } else {
            alert("Library PDF belum siap. Silakan coba lagi nanti.");
        }
    } catch (err) { 
        console.error(err);
        alert("Gagal menyimpan PDF."); 
    } finally { 
        setIsPdfGenerating(false); 
    }
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "data.json";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };
  const handleImportJsonClick = () => fileInputRef.current?.click();
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => { try { setData(JSON.parse(e.target?.result as string)); } catch (err) { alert("Format salah."); } };
      reader.readAsText(file);
    }
  };
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleStudentChange('photoUrl', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Margin Visual Consistency:
  // Screen: Uses padding to simulate margins. 
  // PDF: Uses html2pdf margins.
  // Left: 25mm, Right: 15mm, Top/Bottom: 20mm.
  const containerClasses = isPdfGenerating 
    ? "print-container mx-auto bg-paper-bg pdf-generating" 
    : "print-container max-w-[210mm] mx-auto mt-12 bg-paper-bg shadow-2xl pt-[20mm] pr-[15mm] pb-[20mm] pl-[25mm] min-h-[297mm] mb-12 border border-gray-200";

  return (
    <div className={`min-h-screen bg-gray-100 print:bg-white font-sans ${isPdfGenerating ? 'bg-white' : ''}`}>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />

      {/* Toolbar */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 bg-white shadow-xl rounded-full z-50 px-6 py-3 flex gap-4 border border-gray-200 no-print ${isPdfGenerating ? 'hidden' : ''} print:hidden`}>
        <button onClick={handleImportJsonClick} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="Load Data"><Upload size={18}/></button>
        <button onClick={handleExportJson} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="Save Data"><Download size={18}/></button>
        <div className="w-px h-8 bg-gray-300"></div>
        <button onClick={handleAiGenerate} disabled={isGenerating} className="flex items-center gap-2 px-4 py-1.5 bg-accent text-white rounded-full hover:bg-teal-700 transition font-medium shadow-sm">
          <Sparkles size={16} /> {isGenerating ? 'Menulis...' : 'AI Narasi'}
        </button>
        <button 
          onClick={handleDownloadPDF} 
          disabled={isPdfGenerating} 
          className="flex items-center gap-2 px-4 py-1.5 bg-secondary text-white rounded-full hover:bg-yellow-600 transition shadow-sm font-medium"
        >
          {isPdfGenerating ? <span className="animate-spin text-xs">⏳</span> : <Download size={16} />} 
          <span>Simpan PDF</span>
        </button>
      </div>

      <div className={containerClasses}>
        
        {/* --- HEADER --- */}
        <header className="flex items-center justify-between mb-4 border-b-4 border-double border-black pb-4 avoid-break gap-4">
          {/* Logo Placeholder: Made consistent with PDF look (black/dark border) */}
          <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center bg-gray-50 border border-gray-400 rounded-full relative z-10">
             <span className="text-[10px] font-bold text-gray-500">LOGO</span>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold uppercase text-black mb-1 leading-tight tracking-tight">TK ISLAM ANWAARUL HIDAYAH AL-FALAH</h1>
            <p className="text-sm text-gray-900 mb-2">Perum Green Sejahtera, Desa Jatisela, Kec.Gunungsari</p>
          </div>
          <div className="w-24 flex-shrink-0"></div>
        </header>

        {/* --- JUDUL LAPORAN (Di bawah Garis Kop) --- */}
        <div className="text-center mb-8 avoid-break">
            <h2 className="text-lg font-bold uppercase underline decoration-1 underline-offset-4">Laporan Hasil Belajar</h2>
             <p className="text-sm font-semibold mt-1 uppercase tracking-wide">Tahun Pelajaran {data.student.academicYear}</p>
        </div>

        {/* --- IDENTITAS --- */}
        <div className="mb-8 avoid-break flex gap-6 items-start">
            <div className="flex-1">
              <table className="w-full text-sm border-separate border-spacing-y-1.5">
                <tbody>
                  <tr>
                    <td className="w-[140px] font-semibold align-bottom whitespace-nowrap">Nama Peserta Didik</td>
                    <td className="w-[15px] text-center align-bottom font-bold">:</td>
                    <td className="align-bottom border-b border-dotted border-gray-500">
                      <input 
                        value={data.student.name} 
                        onChange={(e)=>handleStudentChange('name', e.target.value)} 
                        className="w-full font-bold uppercase bg-transparent outline-none py-0.5 text-gray-900"
                        placeholder="..."
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold align-bottom whitespace-nowrap">NIS / NISN</td>
                    <td className="text-center align-bottom font-bold">:</td>
                    <td className="align-bottom border-b border-dotted border-gray-500">
                      <input 
                        value={data.student.nis} 
                        onChange={(e)=>handleStudentChange('nis', e.target.value)} 
                        className="w-full font-bold uppercase bg-transparent outline-none py-0.5 text-gray-900"
                        placeholder="..."
                      />
                    </td>
                  </tr>
                   <tr>
                    <td className="font-semibold align-bottom whitespace-nowrap">Kelompok / Usia</td>
                    <td className="text-center align-bottom font-bold">:</td>
                    <td className="align-bottom border-b border-dotted border-gray-500">
                      <input 
                        value={data.student.group} 
                        onChange={(e)=>handleStudentChange('group', e.target.value)} 
                        className="w-full font-bold bg-transparent outline-none py-0.5 text-gray-900"
                        placeholder="..."
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold align-bottom whitespace-nowrap">Semester</td>
                    <td className="text-center align-bottom font-bold">:</td>
                    <td className="align-bottom border-b border-dotted border-gray-500">
                      <select 
                        value={data.student.semester} 
                        onChange={(e)=>handleStudentChange('semester', e.target.value as any)} 
                        className="w-full font-bold bg-transparent outline-none appearance-none py-0.5 text-gray-900"
                      >
                        <option value="Ganjil">Ganjil</option>
                        <option value="Genap">Genap</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold align-bottom whitespace-nowrap">Alamat</td>
                    <td className="text-center align-bottom font-bold">:</td>
                    <td className="align-bottom border-b border-dotted border-gray-500">
                      <input 
                        value={data.student.address} 
                        onChange={(e)=>handleStudentChange('address', e.target.value)} 
                        className="w-full font-bold bg-transparent outline-none py-0.5 text-gray-900"
                        placeholder="..."
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="w-[30mm] h-[40mm] flex-shrink-0 border border-gray-500 bg-gray-50 flex items-center justify-center relative group overflow-hidden">
               <input type="file" ref={photoInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
               <div onClick={() => photoInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-gray-600">
                 {data.student.photoUrl ? (
                   <img src={data.student.photoUrl} className="w-full h-full object-cover" alt="Foto Siswa" />
                 ) : (
                   <>
                    <Camera size={24} className="mb-1" />
                    <span className="text-[10px] text-center px-1 font-medium leading-tight">FOTO<br/>3x4</span>
                   </>
                 )}
               </div>
            </div>
        </div>

        {/* --- BODY CONTENT --- */}

        {/* A. KESEHATAN */}
        <SectionWrapper title="A. Data Pertumbuhan & Kesehatan">
          <table className="report-table text-sm w-full mb-4">
             <thead className="bg-gray-100 text-center font-bold">
               <tr>
                 <th className="w-1/6 py-2">Berat Badan</th>
                 <th className="w-1/6 py-2">Tinggi Badan</th>
                 <th className="w-1/6 py-2">Lingkar Kepala</th>
                 <th className="w-1/6 py-2">Penglihatan</th>
                 <th className="w-1/6 py-2">Pendengaran</th>
                 <th className="w-1/6 py-2">Gigi</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td className="text-center p-2">
                   <div className="flex items-center justify-center gap-1">
                     <input value={data.health.weight} onChange={e=>handleHealthChange('weight', e.target.value)} className="w-8 text-center bg-transparent outline-none font-semibold" placeholder="-" /> 
                     <span>kg</span>
                   </div>
                 </td>
                 <td className="text-center p-2">
                    <div className="flex items-center justify-center gap-1">
                      <input value={data.health.height} onChange={e=>handleHealthChange('height', e.target.value)} className="w-8 text-center bg-transparent outline-none font-semibold" placeholder="-" />
                      <span>cm</span>
                    </div>
                 </td>
                 <td className="text-center p-2">
                    <div className="flex items-center justify-center gap-1">
                     <input value={data.health.headCircumference} onChange={e=>handleHealthChange('headCircumference', e.target.value)} className="w-8 text-center bg-transparent outline-none font-semibold" placeholder="-" />
                     <span>cm</span>
                    </div>
                 </td>
                 <td className="text-center p-0"><input value={data.health.eyes} onChange={e=>handleHealthChange('eyes', e.target.value)} className="w-full h-full p-2 text-center bg-transparent outline-none" placeholder="-" /></td>
                 <td className="text-center p-0"><input value={data.health.ears} onChange={e=>handleHealthChange('ears', e.target.value)} className="w-full h-full p-2 text-center bg-transparent outline-none" placeholder="-" /></td>
                 <td className="text-center p-0"><input value={data.health.teeth} onChange={e=>handleHealthChange('teeth', e.target.value)} className="w-full h-full p-2 text-center bg-transparent outline-none" placeholder="-" /></td>
               </tr>
             </tbody>
          </table>
        </SectionWrapper>

        {/* B. CPPA */}
        <SectionWrapper title="B. Capaian Perkembangan Anak (CPPA)">
          <table className="report-table text-sm w-full">
            <thead className="bg-gray-100 font-bold">
              <tr>
                <th className="text-center w-10 py-2">No</th>
                <th className="text-left w-1/4 py-2">Lingkup Perkembangan</th>
                <th className="text-left py-2">Deskripsi Singkat</th>
                <th className="text-center w-24 py-2">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {data.cppa.map((item, idx) => (
                <tr key={item.id}>
                  <td className="text-center">{idx + 1}</td>
                  <td className="font-semibold px-2">{item.scope}</td>
                  <td className="italic text-gray-700 px-2">{item.description}</td>
                  <td className="text-center p-0">
                    <select value={item.level} onChange={(e) => handleCPPAChange(item.id, e.target.value as DevelopmentLevel)} 
                      className="w-full h-full text-center bg-transparent font-bold cursor-pointer outline-none block py-3 appearance-none hover:bg-gray-50">
                      {Object.values(DevelopmentLevel).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 text-[10px] text-gray-500 italic text-right">
            * Keterangan: BB (Belum Berkembang), MB (Mulai Berkembang), BSH (Berkembang Sesuai Harapan), BSB (Berkembang Sangat Baik)
          </div>
        </SectionWrapper>

        {/* C. PROYEK */}
        <SectionWrapper title="C. Penilaian Proyek & Harian">
           <table className="report-table text-sm w-full">
              <thead className="bg-gray-100 font-bold">
                <tr>
                  <th className="text-left py-2 px-2">Kegiatan / Proyek</th>
                  <th className="text-left w-1/3 py-2 px-2">Indikator Capaian</th>
                  <th className="text-center w-16 py-2 px-2">Nilai</th>
                  <th className="text-left w-1/4 py-2 px-2">Catatan</th>
                  {!isPdfGenerating && <th className="w-8 border-none print:hidden"></th>}
                </tr>
              </thead>
              <tbody>
                {data.dailyActivities.map((item) => (
                  <tr key={item.id}>
                    <td className="p-0 align-top">
                        <TableText value={item.activity} onChange={(v)=>handleDailyChange(item.id, 'activity', v)} placeholder="Kegiatan..." />
                    </td>
                    <td className="p-0 align-top">
                        <TableText value={item.indicator} onChange={(v)=>handleDailyChange(item.id, 'indicator', v)} placeholder="Indikator..." />
                    </td>
                    <td className="p-0 text-center align-top pt-2">
                       <select value={item.grade} onChange={(e)=>handleDailyChange(item.id, 'grade', e.target.value)} className="w-full p-1 text-center font-bold outline-none bg-transparent appearance-none cursor-pointer">
                         <option value="A">A</option><option value="B">B</option><option value="C">C</option>
                       </select>
                    </td>
                    <td className="p-0 align-top">
                        <TableText value={item.note} onChange={(v)=>handleDailyChange(item.id, 'note', v)} placeholder="Catatan..." />
                    </td>
                    {!isPdfGenerating && (
                        <td className="border-none text-center align-middle print:hidden">
                            <button onClick={() => removeDailyActivity(item.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={14}/></button>
                        </td>
                    )}
                  </tr>
                ))}
              </tbody>
           </table>
           {!isPdfGenerating && (
               <button onClick={addDailyActivity} className="mt-2 text-xs flex items-center gap-1 text-blue-600 hover:underline print:hidden">
                 <Plus size={12}/> Tambah Baris
               </button>
           )}
        </SectionWrapper>

        <div className="page-break"></div>

        {/* D. NARASI */}
        <div className="avoid-break mt-4">
          <SectionWrapper title="D. Deskripsi Perkembangan">
            <div className="border border-black p-4 text-sm leading-relaxed relative">
              <EditableText 
                value={data.narrative} 
                onChange={(val) => setData(p => ({...p, narrative: val}))}
                placeholder="Narasi perkembangan akan muncul di sini (gunakan tombol AI)..."
                minHeight="200px"
              />
              {error && <span className="absolute bottom-2 right-2 text-red-500 text-xs no-print">{error}</span>}
            </div>
          </SectionWrapper>
        </div>

        {/* E & F */}
        <div className="grid grid-cols-2 gap-8 avoid-break">
           <SectionWrapper title="E. Perkembangan Karakter">
              <table className="report-table text-sm w-full">
                <thead className="bg-gray-100 font-bold">
                  <tr>
                    <th className="text-left py-2">Aspek Karakter</th>
                    <th className="text-center w-24 py-2">Predikat</th>
                  </tr>
                </thead>
                <tbody>
                  {data.character.map(c => (
                    <tr key={c.id}>
                      <td className="p-2">{c.aspect}</td>
                      <td className="p-0 text-center">
                        <select value={c.score} onChange={(e)=>handleCharacterChange(c.id, e.target.value as CharacterScore)} className="w-full py-2 text-center bg-transparent outline-none cursor-pointer appearance-none">
                          {Object.values(CharacterScore).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </SectionWrapper>
           
           <div>
             <SectionWrapper title="F. Ketidakhadiran">
                <table className="report-table text-sm w-full mb-6">
                  <tbody>
                    <tr><td className="w-1/2 p-2">Sakit</td><td className="text-center p-2"><input type="number" value={data.attendance.sick} onChange={e=>setData(p=>({...p, attendance: {...p.attendance, sick: +e.target.value}}))} className="w-12 text-center outline-none inline bg-transparent font-bold" /> hari</td></tr>
                    <tr><td className="p-2">Izin</td><td className="text-center p-2"><input type="number" value={data.attendance.permission} onChange={e=>setData(p=>({...p, attendance: {...p.attendance, permission: +e.target.value}}))} className="w-12 text-center outline-none inline bg-transparent font-bold" /> hari</td></tr>
                    <tr><td className="p-2">Tanpa Keterangan</td><td className="text-center p-2"><input type="number" value={data.attendance.alpha} onChange={e=>setData(p=>({...p, attendance: {...p.attendance, alpha: +e.target.value}}))} className="w-12 text-center outline-none inline bg-transparent font-bold" /> hari</td></tr>
                  </tbody>
                </table>
             </SectionWrapper>
             <SectionWrapper title="G. Ekstrakurikuler">
                <table className="report-table text-sm w-full">
                  <thead className="bg-gray-100 font-bold"><tr><th className="text-left py-2">Kegiatan</th><th className="text-center w-16 py-2">Nilai</th></tr></thead>
                  <tbody>
                    {data.extras.map(e => (
                      <tr key={e.id}><td className="p-2">{e.name}</td><td className="text-center font-bold p-2">{e.grade}</td></tr>
                    ))}
                  </tbody>
                </table>
             </SectionWrapper>
           </div>
        </div>

        {/* H. CATATAN & TTD */}
        <div className="avoid-break mt-4">
           <SectionWrapper title="H. Catatan Wali Kelas">
              <div className="border border-black p-4 text-sm italic">
                <EditableText 
                  value={data.teacherNote} 
                  onChange={(val) => setData(p => ({...p, teacherNote: val}))}
                  placeholder="Catatan..."
                  minHeight="80px"
                />
              </div>
           </SectionWrapper>

           {/* FOOTER TTD */}
           <div className="mt-12 text-sm text-center">
             <div className="flex justify-end mb-8 px-8">
               <div className="text-left">
                  <span className="block">Diberikan di : <input value={data.place} onChange={e=>setData(p=>({...p, place: e.target.value}))} className="inline w-32 outline-none border-b border-dotted border-gray-500" /></span>
                  <span className="block mt-1">Tanggal : <input type="date" value={data.date} onChange={e=>setData(p=>({...p, date: e.target.value}))} className="inline outline-none bg-transparent" /></span>
               </div>
             </div>

             <div className="grid grid-cols-3 gap-4">
               {/* Kolom 1: Orang Tua */}
               <div className="flex flex-col justify-between h-40">
                 <p>Mengetahui,<br/>Orang Tua / Wali</p>
                 <div>
                   <span className="block font-bold underline mb-1 uppercase tracking-wide">({data.student.parentName})</span>
                 </div>
               </div>

               {/* Kolom 2: Kepsek */}
               <div className="flex flex-col justify-between h-40">
                 <p>Mengetahui,<br/>Kepala Sekolah</p>
                 <div>
                   <input value={data.principalName} onChange={e=>setData(p=>({...p, principalName: e.target.value}))} className="text-center font-bold underline uppercase w-full outline-none bg-transparent" />
                 </div>
               </div>

               {/* Kolom 3: Wali Kelas */}
               <div className="flex flex-col justify-between h-40">
                 <p>Wali Kelas</p>
                 <div>
                   <input value={data.teacherName} onChange={e=>setData(p=>({...p, teacherName: e.target.value}))} className="text-center font-bold underline uppercase w-full outline-none bg-transparent" />
                 </div>
               </div>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default App;