"use client";
import { useRef } from 'react';
import { Upload } from 'lucide-react';

export default function UploadZone({ title, onUpload }: { title: string, onUpload: (file: File) => void }) {
  // 1. Use a Ref instead of ID - much cleaner for React!
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div 
      onClick={() => fileInputRef.current?.click()} 
      className="group relative border-2 border-dashed border-slate-800 rounded-2xl p-8 flex flex-col items-center bg-[#1e293b]/20 hover:bg-blue-600/5 hover:border-blue-500/50 transition-all cursor-pointer backdrop-blur-sm"
    >
      {/* 2. Visual "Icon Glow" effect */}
      <div className="bg-blue-500/10 p-4 rounded-2xl mb-4 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
        <Upload className="text-blue-500" size={24} />
      </div>
      
      {/* 3. Text colors updated for Dark Mode */}
      <h3 className="font-bold text-slate-200 text-sm tracking-tight">{title}</h3>
      <p className="text-[10px] text-slate-500 mt-1 font-medium">PNG, JPG up to 10MB</p>
      
      {/* 4. Subtle "Status" tag like the reference image */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[8px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
          Ready
        </span>
      </div>

      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        accept="image/*" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            console.log("File selected:", file.name);
            onUpload(file);
          }
        }} 
      />
    </div>
  );
}