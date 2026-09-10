import React from 'react';
import { Settings, Save } from 'lucide-react';

export default function SettingsTab({
  newNickname,
  setNewNickname,
  selectedBrand,
  setSelectedBrand,
  selectedModel,
  setSelectedModel,
  selectedYear,
  setSelectedYear,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  handleSaveSettings
}) {
  return (
    <div className="flex-1 flex flex-col bg-[#0d1322]/70 border border-gray-800/80 rounded-2xl shadow-2xl p-6 overflow-y-auto max-w-2xl mx-auto w-full">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
        <Settings className="text-emerald-400" /> 시스템 설정 및 차량 변경
      </h3>
      <form onSubmit={handleSaveSettings} className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 font-medium block mb-1">닉네임</label>
          <input type="text" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} className="w-full bg-[#090d16] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-medium block mb-1">차량 선택</label>
          <div className="grid grid-cols-3 gap-2">
            <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="bg-[#090d16] border border-gray-800 rounded-xl p-2.5 text-xs text-white outline-none">
              <option value="Volvo">Volvo</option>
            </select>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="bg-[#090d16] border border-gray-800 rounded-xl p-2.5 text-xs text-white outline-none">
              <option value="XC60">XC60</option>
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-[#090d16] border border-gray-800 rounded-xl p-2.5 text-xs text-white outline-none">
              <option value="2024">2024년형</option>
            </select>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-4 space-y-3">
          <h4 className="text-xs font-bold text-gray-300">비밀번호 변경 (선택사항)</h4>
          <input type="password" placeholder="현재 비밀번호" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-[#090d16] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500" />
          <input type="password" placeholder="새 비밀번호" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-[#090d16] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500" />
          <input type="password" placeholder="새 비밀번호 확인" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-[#090d16] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500" />
        </div>
        <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl transition shadow flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> 변경사항 저장
        </button>
      </form>
    </div>
  );
}