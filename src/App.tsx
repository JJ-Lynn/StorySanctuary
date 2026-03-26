import { useState, useEffect, ReactNode, Fragment } from 'react';
import { jsonrepair } from 'jsonrepair';
import { 
  Library, 
  Compass, 
  Users, 
  Moon, 
  User, 
  Bookmark, 
  Heart, 
  Users2, 
  Settings, 
  Search, 
  Link as LinkIcon, 
  Languages, 
  Star, 
  MoreHorizontal,
  Eye,
  Sun,
  ListOrdered,
  UserPlus,
  Sparkles,
  Filter,
  X,
  ClipboardPaste,
  CheckCircle2,
  Loader2,
  ChevronDown,
  EyeOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Story, Stat, StoryStatus } from './types';
import { GoogleGenAI, Type } from "@google/genai";

const COUPLE_ALIASES: Record<string, string> = {
  'Giang Hành x Lý Phái Ân': 'Hành Ân',
  'Hứa Vĩ Kiện x Lý Toàn Lâm': 'Hành Ân',
  'Thẩm Văn Lang x Cao Đồ': 'Lang Đồ',
  'Kim Tại Hưởng x Mẫn Doãn Kỳ': 'Taegi',
  'Mẫn Doãn Kỳ x Kim Tại Hưởng': 'Yoontae',
  'Kim Tại Hưởng x Mẫn Doãn Kì': 'Taegi',
  'Mẫn Doãn Kì x Kim Tại Hưởng': 'Yoontae',
  'Kim Taehyung | V/Min Yoongi | Suga': 'Yoontae'
};

const COUPLE_COLORS: Record<string, string> = {
  'Hành Ân': 'bg-rose-100 text-rose-700 border-rose-200',
  'Lang Đồ': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Yoontae': 'bg-amber-100 text-amber-700 border-amber-200',
  'Taegi': 'bg-zinc-600 text-white border-zinc-700',
  'Tsukikage': 'bg-zinc-200 text-zinc-700 border-zinc-300',
  'Kagetsuki': 'bg-blue-50 text-blue-600 border-blue-100',
  'Kurotsuki': 'bg-zinc-800 text-white border-zinc-900',
  'Bokutsuki': 'bg-zinc-100 text-zinc-800 border-zinc-200',
  'Akatsuki': 'bg-blue-900 text-white border-blue-950'
};

const DEFAULT_COUPLE_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200'
];

const getCoupleDisplay = (name: string) => {
  const cleanName = name.trim();
  const lowerName = cleanName.toLowerCase();
  
  // Hành Ân (Giang Hành x Lý Phái Ân)
  if (
    lowerName.includes('江衡/李沛恩') || 
    lowerName.includes('奖励cp') || 
    lowerName.includes('江衡李沛恩') || 
    lowerName.includes('衡沛 - relationship') ||
    (lowerName.includes('jiang heng') && (lowerName.includes('li pei\'en') || lowerName.includes('li peien')))
  ) {
    return 'Hành Ân';
  }

  // Lang Đồ (Thẩm Văn Lang x Cao Đồ)
  if (
    lowerName.includes('狼兔 - relationship') || 
    lowerName.includes('沈文琅/高途') || 
    (lowerName.includes('gao tu') && lowerName.includes('shen wenlang'))
  ) {
    return 'Lang Đồ';
  }

  if (lowerName.includes('vsuga - relationship') || lowerName.includes('taegi')) {
    return 'Taegi';
  }

  if (lowerName.includes('糖v')) {
    return 'Yoontae';
  }

  if (lowerName.includes('影月') || lowerName.includes('kagetsuki')) {
    return 'Kagetsuki';
  }

  if (lowerName.includes('月影') || lowerName.includes('tsukikage')) {
    return 'Tsukikage';
  }

  // Flexible check for Kageyama x Tsukishima
  // Only pair if explicitly joined by / or x as per user request
  const isKageyama = lowerName.includes('kageyama') || lowerName.includes('tobio') || lowerName.includes('ảnh sơn phi hùng');
  const isTsukishima = lowerName.includes('tsukishima') || lowerName.includes('kei') || lowerName.includes('nguyệt đảo huỳnh');
  const hasCoupleSeparator = lowerName.includes('/') || lowerName.includes(' x ') || lowerName.includes('*');

  if (isKageyama && isTsukishima && hasCoupleSeparator) {
    const kIndex = lowerName.indexOf('kageyama') !== -1 ? lowerName.indexOf('kageyama') : 
                   lowerName.indexOf('tobio') !== -1 ? lowerName.indexOf('tobio') : 
                   lowerName.indexOf('ảnh sơn phi hùng');
    
    const tIndex = lowerName.indexOf('tsukishima') !== -1 ? lowerName.indexOf('tsukishima') : 
                   lowerName.indexOf('kei') !== -1 ? lowerName.indexOf('kei') : 
                   lowerName.indexOf('nguyệt đảo huỳnh');
    
    if (kIndex < tIndex) return 'Kagetsuki';
    return 'Tsukikage';
  }

  // Flexible check for V x Suga
  const isV = lowerName.includes('kim tại hưởng') || lowerName.includes('kim taehyung') || lowerName.includes(' v ');
  const isSuga = lowerName.includes('mẫn doãn kỳ') || lowerName.includes('mẫn doãn kì') || lowerName.includes('min yoongi') || lowerName.includes('suga');

  if (isV && isSuga && hasCoupleSeparator) {
    // Check order to determine Taegi vs Yoontae
    const vIndex = lowerName.indexOf('kim tại hưởng') !== -1 ? lowerName.indexOf('kim tại hưởng') : 
                   lowerName.indexOf('kim taehyung') !== -1 ? lowerName.indexOf('kim taehyung') : 
                   lowerName.indexOf(' v ') !== -1 ? lowerName.indexOf(' v ') : 999;
    
    const sugaIndex = lowerName.indexOf('mẫn doãn kỳ') !== -1 ? lowerName.indexOf('mẫn doãn kỳ') : 
                      lowerName.indexOf('mẫn doãn kì') !== -1 ? lowerName.indexOf('mẫn doãn kì') : 
                      lowerName.indexOf('min yoongi') !== -1 ? lowerName.indexOf('min yoongi') : 
                      lowerName.indexOf('suga') !== -1 ? lowerName.indexOf('suga') : 999;

    if (vIndex < sugaIndex) return 'Taegi';
    return 'Yoontae';
  }

  // Haikyuu Pairings
  const isKuroo = lowerName.includes('kuroo') || lowerName.includes('tetsurou') || lowerName.includes('hắc vĩ thiết lãng');
  const isBokuto = lowerName.includes('bokuto') || lowerName.includes('koutarou') || lowerName.includes('mộc thỏ quang thái lang');
  const isAkaashi = lowerName.includes('akaashi') || lowerName.includes('keiji') || lowerName.includes('xích vi kinh trị') || lowerName.includes('xích vi cảnh trị');
  
  if (isTsukishima && hasCoupleSeparator) {
    if (isKuroo) return 'Kurotsuki';
    if (isBokuto) return 'Bokutsuki';
    if (isAkaashi) return 'Akatsuki';
  }
  
  return COUPLE_ALIASES[cleanName] || cleanName;
};

const FANDOM_ALIASES: Record<string, string> = {
  '垂涎 | Desire: The Series (China TV 2025)': 'Desire',
  '垂涎 | Desire: The Series (China TV 2025) RPF, 奖励 rps': 'Desire',
  '奖励cp, 江衡李沛恩': 'Desire',
  '江衡, 李沛恩, 奖励': 'Desire'
};

const getFandomDisplay = (name: string) => {
  if (!name) return 'Khác';
  
  // Chuẩn hóa: xóa "- Fandom", xóa khoảng trắng thừa
  const cleanName = name.replace(/\s*-\s*Fandom/gi, '').trim();
  
  // Kiểm tra các từ khóa liên quan đến Desire
  const isDesire = 
    cleanName.toLowerCase().includes('desire') || 
    cleanName.includes('垂涎') || 
    cleanName.includes('奖励') || 
    (cleanName.includes('江衡') && cleanName.includes('李沛恩'));

  if (isDesire) return 'Desire';

  // Kiểm tra BTS
  const isBTS = 
    cleanName.toUpperCase().includes('BTS') || 
    cleanName.includes('방탄소년단') || 
    cleanName.toLowerCase().includes('bangtan boys');

  if (isBTS) return 'BTS';
  
  return FANDOM_ALIASES[cleanName] || cleanName;
};

const splitCouples = (coupleStr: string) => {
  if (!coupleStr) return [];
  // Split by |, &, ,, ;, and newlines. 
  // We keep / as it's the internal separator for a couple.
  return coupleStr.split(/[|&,;\n]/).map(c => c.trim()).filter(Boolean);
};

const getStoryCouples = (story: Story) => {
  let displays = story.couple ? splitCouples(story.couple).map(c => getCoupleDisplay(c)) : [];
  
  if (story.originalTitle.includes('糖V')) {
    // If title has 糖V, it must be Yoontae. Remove Taegi if present.
    displays = displays.filter(d => d !== 'Taegi');
    if (!displays.includes('Yoontae')) {
      displays.push('Yoontae');
    }
  }
  
  if (story.originalTitle.includes('影月')) {
    displays = displays.filter(d => d !== 'Tsukikage');
    if (!displays.includes('Kagetsuki')) displays.push('Kagetsuki');
  } else if (story.originalTitle.includes('月影')) {
    displays = displays.filter(d => d !== 'Kagetsuki');
    if (!displays.includes('Tsukikage')) displays.push('Tsukikage');
  }
  return Array.from(new Set(displays));
};

const isGrayCouple = (display: string) => {
  const colorClass = COUPLE_COLORS[display] || '';
  return colorClass.includes('bg-zinc') || colorClass.includes('bg-gray') || colorClass.includes('bg-slate') || colorClass.includes('bg-stone') || colorClass.includes('bg-neutral');
};

const isGrayStory = (story: Story) => {
  const couples = getStoryCouples(story);
  const hasGrayCouple = couples.some(isGrayCouple);
  const hasGrayTag = story.tags?.some(tag => tag.includes('双性'));
  return hasGrayCouple || hasGrayTag;
};

const INITIAL_DATA: Story[] = [];

export default function App() {
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [stories, setStories] = useState<Story[]>(INITIAL_DATA);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importErrorMessage, setImportErrorMessage] = useState('');
  const [editingCoupleId, setEditingCoupleId] = useState<string | null>(null);
  const [editingCoupleValue, setEditingCoupleValue] = useState('');
  const [currentView, setCurrentView] = useState<'library' | 'authors' | 'couples' | 'fandoms'>('library');
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [selectedCouple, setSelectedCouple] = useState<string | null>(null);
  const [selectedFandom, setSelectedFandom] = useState<string | null>(null);
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(null);
  const [hideGrayCouples, setHideGrayCouples] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const [sortField, setSortField] = useState<keyof Story | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[] | null>>({});
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.filter-dropdown-container') && !target.closest('.filter-trigger')) {
        setActiveFilterDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const authors = Array.from(new Set(stories.map(s => s.author)))
    .filter(a => !hideGrayCouples || stories.some(s => s.author === a && !isGrayStory(s)))
    .sort();
  const couples = (Array.from(new Set(stories.flatMap(s => getStoryCouples(s)))) as string[])
    .filter(c => !hideGrayCouples || (!isGrayCouple(c) && stories.some(s => getStoryCouples(s).includes(c) && !isGrayStory(s))))
    .sort();
  const fandoms = Array.from(new Set(stories.map(s => getFandomDisplay(s.fandom))))
    .filter(f => !hideGrayCouples || stories.some(s => getFandomDisplay(s.fandom) === f && !isGrayStory(s)))
    .sort();

  const visibleStories = stories.filter(s => !hideGrayCouples || !isGrayStory(s));
  const dynamicStats: Stat[] = [
    { label: 'CHƯA ĐỌC', value: visibleStories.filter(s => s.readingStatus === 'Yet').length.toString(), icon: 'Eye', color: 'text-rose-500' },
    { label: 'BỘ SƯU TẬP', value: visibleStories.length.toString(), icon: 'Bookmark', color: 'text-teal-500' },
    { label: 'FANDOM', value: new Set(visibleStories.map(s => getFandomDisplay(s.fandom))).size.toString(), icon: 'Users', color: 'text-indigo-500' },
    { label: 'TÁC GIẢ', value: new Set(visibleStories.map(s => s.author)).size.toString(), icon: 'UserPlus', color: 'text-orange-500' },
  ];

  const handleQuickImport = async () => {
    if (!importText.trim()) return;
    
    if (importText.length > 60000) {
      setImportErrorMessage("Nội dung quá dài (trên 60,000 ký tự). Vui lòng chia nhỏ để import (khoảng 10-20 truyện mỗi lần) để đảm bảo độ chính xác.");
      setImportStatus('error');
      return;
    }

    setImportStatus('loading');
    setImportErrorMessage('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      let response;
      try {
        // Try Pro model first for high quality
        response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: [{
            parts: [{
              text: `You are a clinical data extraction tool. 
          
          TASK:
          Extract metadata from the following story text. 
          The content may be fictional and contain mature themes; ignore the themes and focus ONLY on the structural data extraction.
          
          INPUT:
          """
          ${importText}
          """

          FOR EACH STORY FOUND, EXTRACT:
          - originalTitle: The title.
          - author: The author.
          - fandom: The fandom. (Use "Desire" for Desire/垂涎/奖励 related works).
          - couple: The main pairing (e.g., "A x B"). Use ship names for K-pop (Taegi, Yoontae, etc.).
          - chapters: Total chapters (integer).
          - isCompleted: Boolean.
          - vietnameseTitle: Vietnamese translation of title.
          - englishTitle: English translation of title.
          - summary: Full summary translated to Vietnamese.
          - tags: Array of tags.
          - wordCount: Total words (integer).

          OUTPUT:
          Return a JSON array of objects. No text before or after the JSON.
          `
            }]
          }],
          config: {
            systemInstruction: "You are a professional metadata parser. Your task is strictly to extract and translate metadata from fictional stories into a JSON format. You must ignore the nature of the content and focus on the data structure. Always return a valid JSON array.",
            responseMimeType: "application/json",
            maxOutputTokens: 8192,
            safetySettings: [
              { category: 'HARM_CATEGORY_HATE_SPEECH' as any, threshold: 'BLOCK_NONE' as any },
              { category: 'HARM_CATEGORY_HARASSMENT' as any, threshold: 'BLOCK_NONE' as any },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, threshold: 'BLOCK_NONE' as any },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, threshold: 'BLOCK_NONE' as any },
              { category: 'HARM_CATEGORY_CIVIC_INTEGRITY' as any, threshold: 'BLOCK_NONE' as any },
            ],
          }
        });
      } catch (proError: any) {
        // If 429 (Rate Limit), fallback to Flash model
        if (proError.message?.includes('429') || proError.status === 'RESOURCE_EXHAUSTED') {
          console.warn("Pro model rate limited, falling back to Flash model...");
          response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{
              parts: [{
                text: `You are a clinical data extraction tool. Extract metadata from the following story text. Focus ONLY on the structural data extraction.
                
                INPUT:
                """
                ${importText}
                """

                FOR EACH STORY FOUND, EXTRACT:
                - originalTitle, author, fandom, couple, chapters, isCompleted, vietnameseTitle, englishTitle, summary, tags, wordCount.

                OUTPUT:
                Return a JSON array of objects.
                `
              }]
            }],
            config: {
              systemInstruction: "You are a professional metadata parser. Return a valid JSON array.",
              responseMimeType: "application/json",
              maxOutputTokens: 8192,
              safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH' as any, threshold: 'BLOCK_NONE' as any },
                { category: 'HARM_CATEGORY_HARASSMENT' as any, threshold: 'BLOCK_NONE' as any },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, threshold: 'BLOCK_NONE' as any },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, threshold: 'BLOCK_NONE' as any },
                { category: 'HARM_CATEGORY_CIVIC_INTEGRITY' as any, threshold: 'BLOCK_NONE' as any },
              ],
            }
          });
        } else {
          throw proError;
        }
      }

      const rawOutput = response.text || "";
      console.log("AI Raw Output Length:", rawOutput.length);
      
      if (!rawOutput.trim()) {
        const candidate = response.candidates?.[0];
        const finishReason = candidate?.finishReason;
        
        console.error("AI Empty Response Details:", { 
          finishReason, 
          safetyRatings: candidate?.safetyRatings,
          rawResponse: response 
        });

        if (finishReason === 'SAFETY') {
          throw new Error("Nội dung bị chặn bởi bộ lọc an toàn của AI. Điều này thường xảy ra khi truyện có nội dung nhạy cảm cao. Hãy thử dán đoạn văn bản khác hoặc chia nhỏ nội dung.");
        }
        if (finishReason === 'RECITATION') {
          throw new Error("Nội dung bị chặn do vi phạm bản quyền (Recitation). Hãy thử dán đoạn văn bản khác.");
        }
        if (finishReason === 'MAX_TOKENS') {
          throw new Error("Dữ liệu quá lớn khiến AI bị ngắt quãng. Hãy thử dán đoạn văn bản ngắn hơn.");
        }
        
        if (!response.candidates || response.candidates.length === 0) {
          throw new Error("AI không trả về kết quả. Có thể nội dung bị chặn hoàn toàn bởi hệ thống an toàn do tính chất nhạy cảm của truyện. Hãy thử dán từng truyện một.");
        }

        throw new Error(`AI không trả về kết quả (Lý do: ${finishReason || 'Không xác định'}). Hãy thử dán đoạn văn bản ngắn hơn hoặc kiểm tra lại nội dung.`);
      }

      let parsedData: any[] = [];
      
      // Helper to clean and parse JSON
      const tryParseJSON = (str: string) => {
        try {
          // 1. Remove markdown code blocks
          let cleanStr = str.replace(/```json\s*|```\s*/g, '').trim();
          
          // 2. Try direct parse
          try {
            return JSON.parse(cleanStr);
          } catch (e) {
            console.warn("Direct JSON parse failed, attempting repair...");
            
            // 3. Try jsonrepair (very robust for truncated/malformed JSON)
            try {
              const repaired = jsonrepair(cleanStr);
              return JSON.parse(repaired);
            } catch (repairError) {
              console.warn("jsonrepair failed, attempting manual extraction and repair...");
              
              // 4. Try to extract array if it's wrapped in text
              const arrayMatch = cleanStr.match(/\[\s*\{.*\}\s*\]/s);
              if (arrayMatch) {
                try { return JSON.parse(arrayMatch[0]); } catch (e2) {
                  try { return JSON.parse(jsonrepair(arrayMatch[0])); } catch (e3) {}
                }
              }
              
              // 5. Handle truncated JSON (common when importing too many stories)
              // Find the first [ to start the array
              const firstBracket = cleanStr.indexOf('[');
              if (firstBracket !== -1) {
                const potentialJson = cleanStr.substring(firstBracket);
                
                // Find the last complete object in the array
                let lastObjectEnd = potentialJson.lastIndexOf('}');
                
                while (lastObjectEnd !== -1) {
                  let repairedStr = potentialJson.substring(0, lastObjectEnd + 1).trim();
                  
                  // Remove trailing comma if present
                  if (repairedStr.endsWith(',')) {
                    repairedStr = repairedStr.substring(0, repairedStr.length - 1).trim();
                  }
                  
                  // Ensure it ends with ]
                  if (!repairedStr.endsWith(']')) {
                    repairedStr += ']';
                  }
                  
                  try {
                    return JSON.parse(repairedStr);
                  } catch (e2) {
                    // Try jsonrepair on the partial string
                    try {
                      return JSON.parse(jsonrepair(repairedStr));
                    } catch (e3) {
                      // Try to find the previous object end
                      lastObjectEnd = potentialJson.lastIndexOf('}', lastObjectEnd - 1);
                    }
                  }
                }
              }
            }
            throw e;
          }
        } catch (e) {
          console.error("JSON Parse Error Details:", e);
          return null;
        }
      };

      parsedData = tryParseJSON(rawOutput);
      console.log("Parsed Stories Count:", parsedData?.length || 0);
      
      if (!parsedData) {
        const finishReason = response.candidates?.[0]?.finishReason;
        if (finishReason === 'MAX_TOKENS') {
          throw new Error("Dữ liệu quá lớn khiến AI bị ngắt quãng và không thể tự động sửa lỗi JSON. Hãy thử chia nhỏ danh sách truyện để import (ví dụ: 10-20 truyện mỗi lần).");
        }
        throw new Error("Định dạng dữ liệu AI trả về không hợp lệ hoặc bị quá tải. Hãy thử chia nhỏ danh sách truyện để import (ví dụ: 10-20 truyện mỗi lần).");
      }

      if (rawOutput.length > 0 && Array.isArray(parsedData) && !rawOutput.trim().endsWith(']')) {
        console.warn(`Đã khôi phục ${parsedData.length} truyện từ dữ liệu AI bị ngắt quãng.`);
      }
      
      if (!Array.isArray(parsedData)) {
        if (typeof parsedData === 'object' && parsedData !== null) {
          const possibleArray = Object.values(parsedData).find(v => Array.isArray(v));
          if (possibleArray) parsedData = possibleArray as any[];
          else parsedData = [parsedData];
        } else {
          parsedData = [];
        }
      }
      
      if (parsedData.length === 0) {
        throw new Error("Không tìm thấy thông tin truyện. Hãy đảm bảo bạn đã dán đúng định dạng metadata từ AO3.");
      }

      const newStories: Story[] = parsedData.map((item: any, index: number) => {
        const rawTitle = item.originalTitle || item.title || 'Truyện mới';
        let finalTitle = rawTitle;
        let finalAuthor = item.author || 'Ẩn danh';

        if (rawTitle.includes(' by ')) {
          const parts = rawTitle.split(' by ');
          finalTitle = parts[0].trim();
          if (finalAuthor === 'Ẩn danh') finalAuthor = parts[1].trim();
        }

        return {
          id: `imported-${Date.now()}-${index}`,
          originalTitle: finalTitle,
          englishTitle: item.englishTitle || '',
          vietnameseTitle: item.vietnameseTitle || '',
          author: finalAuthor,
          summary: item.summary || '',
          tags: item.tags || [],
          wordCount: item.wordCount || 0,
          fandom: item.fandom || 'Khác',
          couple: item.couple || item.pairing || item.relationship || '',
          chapters: Number(item.chapters) || 0,
          isCompleted: !!item.isCompleted,
          readingStatus: 'Yet',
          translationStatus: 'Yet',
          rating: 0,
          links: { original: '#', translation: '#' }
        };
      });

      setStories(prev => [...newStories, ...prev]);
      setImportStatus('success');
      
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportText('');
        setImportStatus('idle');
      }, 1000);
    } catch (error: any) {
      console.error("Import error details:", error);
      setImportStatus('error');
      
      let message = "Có lỗi xảy ra khi xử lý dữ liệu.";
      if (error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED') {
        message = "Hệ thống AI đang quá tải (Rate Limit). Vui lòng đợi 1-2 phút rồi thử lại, hoặc chia nhỏ danh sách truyện.";
      } else if (error.message?.includes('SAFETY')) {
        message = "Nội dung bị chặn bởi bộ lọc an toàn. Hãy thử dán từng truyện một hoặc lược bỏ các từ nhạy cảm.";
      } else if (error.message) {
        message = error.message;
      }
      
      setImportErrorMessage(message);
      setTimeout(() => {
        setImportStatus('idle');
        setImportErrorMessage('');
      }, 8000);
    }
  };

  const handleSort = (field: keyof Story) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const FilterDropdown = ({ 
    column, 
    values, 
    onFilterChange, 
    currentFilters 
  }: { 
    column: string, 
    values: string[], 
    onFilterChange: (values: string[] | null) => void,
    currentFilters: string[] | null
  }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredValues = values.filter(v => v.toLowerCase().includes(searchTerm.toLowerCase()));
    const [tempFilters, setTempFilters] = useState<string[]>(currentFilters || values);

    const toggleValue = (val: string) => {
      if (tempFilters.includes(val)) {
        setTempFilters(tempFilters.filter(v => v !== val));
      } else {
        setTempFilters([...tempFilters, val]);
      }
    };

    return (
      <div className="filter-dropdown-container absolute top-full left-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-100 dark:border-dark-border z-50 p-4 text-zinc-800 dark:text-dark-text normal-case tracking-normal font-normal">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-dark-border pb-2">
            <span className="text-xs font-bold text-zinc-400 dark:text-dark-muted uppercase tracking-widest">Lọc theo giá trị</span>
            <button 
              onClick={() => setActiveFilterDropdown(null)}
              className="text-zinc-400 dark:text-dark-muted hover:text-zinc-600 dark:hover:text-dark-text"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-4 text-[11px] font-bold">
            <button 
              onClick={() => setTempFilters(values)}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Chọn tất cả {values.length}
            </button>
            <span className="text-zinc-300 dark:text-zinc-700">-</span>
            <button 
              onClick={() => setTempFilters([])}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Xóa
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-dark-muted" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-dark-border rounded-lg text-xs focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-900/30 transition-all text-zinc-800 dark:text-dark-text"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
            {filteredValues.map(val => (
              <label key={val} className="flex items-center gap-2 p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md cursor-pointer transition-colors group">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    checked={tempFilters.includes(val)}
                    onChange={() => toggleValue(val)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-rose-500 focus:ring-rose-500 cursor-pointer bg-white dark:bg-zinc-800"
                  />
                </div>
                <span className="text-xs text-zinc-600 dark:text-dark-muted group-hover:text-zinc-900 dark:group-hover:text-dark-text transition-colors truncate">{val}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-dark-border">
            <button 
              onClick={() => {
                onFilterChange(tempFilters.length === values.length ? null : tempFilters);
                setActiveFilterDropdown(null);
              }}
              className="flex-1 py-2 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600 transition-all"
            >
              Áp dụng
            </button>
            <button 
              onClick={() => setActiveFilterDropdown(null)}
              className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-dark-muted rounded-lg text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    );
  };

  const filteredAndSortedStories = [...stories]
    .filter(s => {
      const matchesTab = 
        activeTab === 'Tất cả' || 
        (activeTab === 'Hoàn thành' && s.isCompleted);

      return matchesTab &&
        (!selectedAuthor || s.author === selectedAuthor) && 
        (!selectedCouple || getStoryCouples(s).includes(selectedCouple)) &&
        (!selectedFandom || getFandomDisplay(s.fandom) === selectedFandom) &&
        (!hideGrayCouples || !isGrayStory(s)) &&
        (!columnFilters.fandom || columnFilters.fandom.includes(getFandomDisplay(s.fandom))) &&
        (!columnFilters.couple || getStoryCouples(s).some(c => columnFilters.couple?.includes(c))) &&
        (!columnFilters.translationStatus || columnFilters.translationStatus.includes(s.translationStatus)) &&
        (!columnFilters.readingStatus || columnFilters.readingStatus.includes(s.readingStatus)) &&
        (!columnFilters.isCompleted || columnFilters.isCompleted.includes(s.isCompleted ? 'Hoàn' : 'Chưa hoàn'));
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (aValue === bValue) return 0;
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = aValue < bValue ? -1 : 1;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleUpdateCouple = (id: string) => {
    setStories(prev => prev.map(s => s.id === id ? { ...s, couple: editingCoupleValue } : s));
    setEditingCoupleId(null);
  };

  const handleUpdateStatus = (id: string, field: 'readingStatus' | 'translationStatus', value: StoryStatus) => {
    setStories(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleUpdateRating = (id: string, rating: number) => {
    setStories(prev => prev.map(s => s.id === id ? { ...s, rating } : s));
  };

  return (
    <div className="min-h-screen flex font-sans bg-app-bg dark:bg-dark-bg transition-colors duration-300">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/90 dark:bg-dark-card/80 backdrop-blur-md border-b border-zinc-200/50 dark:border-dark-border z-30 px-8 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-brand-primary dark:text-rose-400 tracking-tight">StorySanctuary</span>
            <Sparkles className="w-4 h-4 text-rose-400 fill-rose-400" />
          </div>

          <nav className="flex items-center gap-1">
            <NavItem 
              icon={<Bookmark className="w-5 h-5" />} 
              label="Bộ sưu tập" 
              active={currentView === 'library' && !selectedAuthor} 
              onClick={() => {
                setCurrentView('library');
                setSelectedAuthor(null);
              }}
            />
            <NavItem 
              icon={<Heart className="w-5 h-5" />} 
              label="Tác giả" 
              active={currentView === 'authors' || !!selectedAuthor}
              onClick={() => {
                setCurrentView('authors');
                setSelectedAuthor(null);
                setSelectedCouple(null);
              }}
            />
            <NavItem 
              icon={<Users2 className="w-5 h-5" />} 
              label="Couple" 
              active={currentView === 'couples' || !!selectedCouple}
              onClick={() => {
                setCurrentView('couples');
                setSelectedAuthor(null);
                setSelectedCouple(null);
                setSelectedFandom(null);
              }}
            />
            <NavItem 
              icon={<Users className="w-5 h-5" />} 
              label="Fandom" 
              active={currentView === 'fandoms' || !!selectedFandom}
              onClick={() => {
                setCurrentView('fandoms');
                setSelectedAuthor(null);
                setSelectedCouple(null);
                setSelectedFandom(null);
              }}
            />
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl bg-zinc-50 dark:bg-dark-border text-zinc-500 dark:text-dark-text hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-3 bg-zinc-100/50 dark:bg-dark-border/50 px-4 py-2 rounded-2xl border border-zinc-200/50 dark:border-dark-border">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
              <img 
                src="https://picsum.photos/seed/user/100/100" 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-bold text-zinc-800 dark:text-dark-text leading-none mb-0.5">Thư viện của tôi</p>
              <p className="text-[10px] text-zinc-500 dark:text-dark-muted leading-none">{stories.length} bộ sưu tập</p>
            </div>
          </div>
          <button className="p-2 text-zinc-400 dark:text-dark-muted hover:text-rose-500 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-20">
        {/* Top Header */}
        <header className="h-24 flex items-center justify-center px-8 sticky top-0 bg-transparent z-10">
          <div className="flex items-center gap-4">
            <div className="bg-white dark:bg-dark-card p-1.5 rounded-full flex items-center shadow-lg shadow-rose-900/5 border border-zinc-200/50 dark:border-dark-border">
              {['Tất cả', 'Hoàn thành'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-3 text-base font-bold transition-all rounded-full ${
                    activeTab === tab 
                      ? 'bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-dark-text shadow-inner' 
                      : 'text-zinc-400 dark:text-dark-muted hover:text-zinc-600 dark:hover:text-dark-text'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setHideGrayCouples(!hideGrayCouples)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md border border-zinc-100 dark:border-dark-border ${
                !hideGrayCouples 
                  ? 'bg-rose-500 text-white border-rose-600' 
                  : 'bg-white dark:bg-dark-card text-zinc-400 dark:text-dark-muted hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
              title={hideGrayCouples ? "Hiện các truyện highlight xám" : "Ẩn các truyện highlight xám"}
            >
              {hideGrayCouples ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {currentView === 'authors' ? (
            <div>
              <div className="flex items-center gap-4 mb-10">
                <button 
                  onClick={() => setCurrentView('library')}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  <X className="w-6 h-6 text-zinc-400 dark:text-dark-muted" />
                </button>
                <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-dark-text">Danh sách Tác giả</h1>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(authors as string[]).map(author => (
                  <button
                    key={author}
                    onClick={() => {
                      setSelectedAuthor(author);
                      setSelectedCouple(null);
                      setCurrentView('library');
                    }}
                    className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-dark-border hover:border-rose-200 dark:hover:border-rose-900/50 hover:shadow-xl hover:shadow-rose-900/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 dark:text-rose-400 font-bold text-xl group-hover:bg-rose-500 dark:group-hover:bg-rose-600 group-hover:text-white transition-all">
                        {author.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-800 dark:text-dark-text group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{author}</p>
                        <p className="text-xs text-zinc-500 dark:text-dark-muted">{stories.filter(s => s.author === author && (!hideGrayCouples || !isGrayStory(s))).length} truyện</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : currentView === 'couples' ? (
            <div>
              <div className="flex items-center gap-4 mb-10">
                <button 
                  onClick={() => setCurrentView('library')}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  <X className="w-6 h-6 text-zinc-400 dark:text-dark-muted" />
                </button>
                <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-dark-text">Danh sách Couple</h1>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(couples as string[]).map(couple => (
                  <button
                    key={couple}
                    onClick={() => {
                      setSelectedCouple(couple);
                      setSelectedAuthor(null);
                      setSelectedFandom(null);
                      setCurrentView('library');
                    }}
                    className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-dark-border hover:border-rose-200 dark:hover:border-rose-900/50 hover:shadow-xl hover:shadow-rose-900/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 font-bold text-xl group-hover:bg-indigo-500 dark:group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Users2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-800 dark:text-dark-text group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{couple}</p>
                        <p className="text-xs text-zinc-500 dark:text-dark-muted">{stories.filter(s => getStoryCouples(s).includes(couple) && (!hideGrayCouples || !isGrayStory(s))).length} truyện</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : currentView === 'fandoms' ? (
            <div>
              <div className="flex items-center gap-4 mb-10">
                <button 
                  onClick={() => setCurrentView('library')}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  <X className="w-6 h-6 text-zinc-400 dark:text-dark-muted" />
                </button>
                <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-dark-text">Danh sách Fandom</h1>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(fandoms as string[]).map(fandom => (
                  <button
                    key={fandom}
                    onClick={() => {
                      setSelectedFandom(fandom);
                      setSelectedAuthor(null);
                      setSelectedCouple(null);
                      setCurrentView('library');
                    }}
                    className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-dark-border hover:border-rose-200 dark:hover:border-rose-900/50 hover:shadow-xl hover:shadow-rose-900/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-500 dark:text-teal-400 font-bold text-xl group-hover:bg-teal-500 dark:group-hover:bg-teal-600 group-hover:text-white transition-all">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-800 dark:text-dark-text group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{fandom}</p>
                        <p className="text-xs text-zinc-500 dark:text-dark-muted">{stories.filter(s => getFandomDisplay(s.fandom) === fandom && (!hideGrayCouples || !isGrayStory(s))).length} truyện</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-start items-center mb-6">
                <button 
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 text-white rounded-full text-sm font-bold hover:bg-rose-600 transition-all active:scale-95 shadow-lg shadow-rose-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  Quick Import
                </button>
              </div>

          {/* Table Section */}
          <div className="bg-white dark:bg-dark-card rounded-[2.5rem] p-8 shadow-xl shadow-rose-900/5 border border-white dark:border-dark-border mb-8 transition-colors">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                </div>
                <h2 className="text-xl font-bold text-zinc-800 dark:text-dark-text">Danh sách truyện sưu tầm</h2>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-dark-muted" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm truyện..." 
                  className="pl-11 pr-6 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-full text-sm focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900/30 w-72 transition-all text-zinc-800 dark:text-dark-text placeholder-zinc-400 dark:placeholder-dark-muted"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-extrabold text-zinc-400 dark:text-dark-muted uppercase tracking-widest border-b border-zinc-50 dark:border-dark-border">
                    <th className="pb-4 px-4 w-[16%]">
                      <div className="flex items-center gap-1">
                        Tên truyện gốc
                      </div>
                    </th>
                    <th className="pb-4 px-4 w-[10%]">Dịch tiếng Anh</th>
                    <th className="pb-4 px-4 w-[10%]">Dịch tiếng Việt</th>
                    <th className="pb-4 px-4 w-[10%] relative">
                      <div className="flex items-center justify-between group">
                        <span>Fandom</span>
                        <button 
                          onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'fandom' ? null : 'fandom')}
                          className={`filter-trigger p-1 rounded hover:bg-zinc-100 transition-colors ${columnFilters.fandom ? 'text-rose-500' : 'text-zinc-300'}`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                      {activeFilterDropdown === 'fandom' && (
                        <FilterDropdown 
                          column="fandom"
                          values={(Array.from(new Set(stories.map(s => getFandomDisplay(s.fandom)))) as string[]).sort()}
                          currentFilters={columnFilters.fandom || null}
                          onFilterChange={(vals) => setColumnFilters(prev => ({ ...prev, fandom: vals }))}
                        />
                      )}
                    </th>
                    <th className="pb-4 px-4 w-[10%]">
                      <div className="flex items-center gap-1">
                        Tác giả
                      </div>
                    </th>
                    <th className="pb-4 px-4 w-[10%] relative">
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-1">
                          Couple
                        </div>
                        <button 
                          onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'couple' ? null : 'couple')}
                          className={`filter-trigger p-1 rounded hover:bg-zinc-100 transition-colors ${columnFilters.couple ? 'text-rose-500' : 'text-zinc-300'}`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                      {activeFilterDropdown === 'couple' && (
                        <FilterDropdown 
                          column="couple"
                          values={(Array.from(new Set(stories.flatMap(s => getStoryCouples(s)))) as string[]).sort()}
                          currentFilters={columnFilters.couple || null}
                          onFilterChange={(vals) => setColumnFilters(prev => ({ ...prev, couple: vals }))}
                        />
                      )}
                    </th>
                    <th className="pb-4 px-4 w-[8%] text-center relative">
                      <div className="flex items-center justify-center gap-2 group">
                        <div 
                          className="flex items-center gap-1 cursor-pointer hover:text-zinc-600 transition-colors"
                          onClick={() => handleSort('chapters')}
                        >
                          Chương
                          {sortField === 'chapters' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                        </div>
                        <button 
                          onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'isCompleted' ? null : 'isCompleted')}
                          className={`filter-trigger p-1 rounded hover:bg-zinc-100 transition-colors ${columnFilters.isCompleted ? 'text-rose-500' : 'text-zinc-300'}`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                      {activeFilterDropdown === 'isCompleted' && (
                        <FilterDropdown 
                          column="isCompleted"
                          values={['Hoàn', 'Chưa hoàn']}
                          currentFilters={columnFilters.isCompleted || null}
                          onFilterChange={(vals) => setColumnFilters(prev => ({ ...prev, isCompleted: vals }))}
                        />
                      )}
                    </th>
                    <th className="pb-4 px-4 w-[6%] text-center">Links</th>
                    <th className="pb-4 px-4 w-[8%] relative">
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-1">
                          Status Dịch
                        </div>
                        <button 
                          onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'translationStatus' ? null : 'translationStatus')}
                          className={`filter-trigger p-1 rounded hover:bg-zinc-100 transition-colors ${columnFilters.translationStatus ? 'text-rose-500' : 'text-zinc-300'}`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                      {activeFilterDropdown === 'translationStatus' && (
                        <FilterDropdown 
                          column="translationStatus"
                          values={['Yet', '-ing', 'Done']}
                          currentFilters={columnFilters.translationStatus || null}
                          onFilterChange={(vals) => setColumnFilters(prev => ({ ...prev, translationStatus: vals }))}
                        />
                      )}
                    </th>
                    <th className="pb-4 px-4 w-[8%] relative">
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-1">
                          Status Đọc
                        </div>
                        <button 
                          onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'readingStatus' ? null : 'readingStatus')}
                          className={`filter-trigger p-1 rounded hover:bg-zinc-100 transition-colors ${columnFilters.readingStatus ? 'text-rose-500' : 'text-zinc-300'}`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                      {activeFilterDropdown === 'readingStatus' && (
                        <FilterDropdown 
                          column="readingStatus"
                          values={['Yet', '-ing', 'Done']}
                          currentFilters={columnFilters.readingStatus || null}
                          onFilterChange={(vals) => setColumnFilters(prev => ({ ...prev, readingStatus: vals }))}
                        />
                      )}
                    </th>
                    <th className="pb-4 px-4 w-[4%]">Rating</th>
                    <th className="pb-4 px-4 w-[4%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredAndSortedStories
                    .map((story) => {
                      const isTaegi = story.couple.toLowerCase().includes('vsuga - relationship') || story.couple.toLowerCase().includes('taegi');
                      const isGray = isGrayStory(story);
                      return (
                    <Fragment key={story.id}>
                      <tr className={`group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors ${isTaegi ? 'bg-zinc-100/80 dark:bg-zinc-800/50' : ''} ${isGray ? 'bg-zinc-100/50 dark:bg-zinc-900/30 opacity-60' : ''}`}>
                        <td className="py-6 px-4">
                          <p className="font-bold text-zinc-900 dark:text-dark-text text-sm">{story.originalTitle}</p>
                        </td>
                      <td className="py-6 px-4">
                        <p className="text-xs font-medium text-zinc-500 dark:text-dark-muted">{story.englishTitle}</p>
                      </td>
                      <td className="py-6 px-4">
                        <p className="text-xs font-bold text-brand-primary dark:text-rose-400">{story.vietnameseTitle}</p>
                      </td>
                      <td className="py-6 px-4">
                        <span className="px-2 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg text-[10px] font-bold border border-teal-100 dark:border-teal-900/30">
                          {getFandomDisplay(story.fandom)}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-sm text-zinc-800 dark:text-dark-text">{story.author}</td>
                      <td className="py-6 px-4 text-sm">
                        {editingCoupleId === story.id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="text"
                              value={editingCoupleValue}
                              onChange={(e) => setEditingCoupleValue(e.target.value)}
                              onBlur={() => handleUpdateCouple(story.id)}
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdateCouple(story.id)}
                              autoFocus
                              className="w-full bg-white dark:bg-zinc-800 border border-rose-200 dark:border-rose-900/30 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-rose-300 dark:focus:ring-rose-900/50 outline-none text-zinc-800 dark:text-dark-text"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {(() => {
                              const uniqueDisplays = getStoryCouples(story);
                              
                              if (uniqueDisplays.length === 0) {
                                return (
                                  <div 
                                    onClick={() => {
                                      setEditingCoupleId(story.id);
                                      setEditingCoupleValue('');
                                    }}
                                    className="text-xs text-zinc-400 italic cursor-pointer hover:text-brand-primary"
                                  >
                                    Chưa có couple
                                  </div>
                                );
                              }

                              return uniqueDisplays.map((display, i) => {
                                const colorIdx = display.length % DEFAULT_COUPLE_COLORS.length;
                                const colorClass = COUPLE_COLORS[display] || DEFAULT_COUPLE_COLORS[colorIdx];
                                
                                return (
                                  <div 
                                    key={i}
                                    onClick={() => {
                                      setEditingCoupleId(story.id);
                                      setEditingCoupleValue(story.couple);
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all hover:shadow-sm cursor-pointer ${colorClass}`}
                                  >
                                    {display}
                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </td>
                      <td className={`py-6 px-4 text-sm text-center font-bold rounded-xl transition-colors ${story.isCompleted ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' : 'text-zinc-900 dark:text-dark-text'}`}>
                        <div className="flex flex-col items-center gap-1">
                          <span>{story.chapters}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${story.isCompleted ? 'bg-teal-200/50 dark:bg-teal-800/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-dark-muted'}`}>
                            {story.isCompleted ? 'Hoàn' : 'Chưa'}
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <div className="flex gap-2 justify-center">
                          <button className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-dark-muted hover:text-brand-primary hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
                            <LinkIcon className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-dark-muted hover:text-brand-primary hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
                            <Languages className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <div className="relative inline-block">
                          <select 
                            value={story.translationStatus}
                            onChange={(e) => handleUpdateStatus(story.id, 'translationStatus', e.target.value as StoryStatus)}
                            className={`appearance-none pl-3 pr-8 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border-none focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900/30 cursor-pointer transition-all ${
                              story.translationStatus === 'Done' ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' :
                              story.translationStatus === '-ing' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                              'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            <option value="Yet" className="dark:bg-zinc-900">Yet</option>
                            <option value="-ing" className="dark:bg-zinc-900">-ing</option>
                            <option value="Done" className="dark:bg-zinc-900">Done</option>
                          </select>
                          <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60 ${
                            story.translationStatus === 'Done' ? 'text-teal-600' :
                            story.translationStatus === '-ing' ? 'text-indigo-600' :
                            'text-rose-600'
                          }`} />
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <div className="relative inline-block">
                          <select 
                            value={story.readingStatus}
                            onChange={(e) => handleUpdateStatus(story.id, 'readingStatus', e.target.value as StoryStatus)}
                            className={`appearance-none pl-3 pr-8 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border-none focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900/30 cursor-pointer transition-all ${
                              story.readingStatus === 'Done' ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' :
                              story.readingStatus === '-ing' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                              'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            <option value="Yet" className="dark:bg-zinc-900">Yet</option>
                            <option value="-ing" className="dark:bg-zinc-900">-ing</option>
                            <option value="Done" className="dark:bg-zinc-900">Done</option>
                          </select>
                          <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60 ${
                            story.readingStatus === 'Done' ? 'text-teal-600' :
                            story.readingStatus === '-ing' ? 'text-indigo-600' :
                            'text-rose-600'
                          }`} />
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => {
                            const starValue = i + 1;
                            return (
                              <button
                                key={i}
                                onClick={() => handleUpdateRating(story.id, starValue)}
                                className="transition-all hover:scale-125 active:scale-90"
                              >
                                <Star 
                                  className={`w-3.5 h-3.5 ${starValue <= story.rating ? 'text-brand-primary dark:text-rose-400 fill-current' : 'text-zinc-200 dark:text-zinc-700'}`} 
                                />
                              </button>
                            );
                          })}
                        </div>
                      </td>
                        <td className="py-6 px-4">
                          <button 
                            onClick={() => setExpandedStoryId(expandedStoryId === story.id ? null : story.id)}
                            className={`p-2 rounded-xl transition-all ${expandedStoryId === story.id ? 'bg-rose-100 dark:bg-rose-900/30 text-brand-primary dark:text-rose-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-dark-muted hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-brand-primary dark:hover:text-rose-400'}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                    </tr>
                    {expandedStoryId === story.id && (
                      <tr className="bg-rose-50/30 dark:bg-rose-900/10">
                        <td colSpan={12} className="p-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest mb-1">Tên đầy đủ</h4>
                                <p className="text-zinc-900 dark:text-dark-text font-bold">{story.originalTitle}</p>
                                <p className="text-xs text-zinc-500 dark:text-dark-muted italic mt-1">{story.englishTitle}</p>
                                <p className="text-sm text-brand-primary dark:text-rose-400 font-bold mt-1">{story.vietnameseTitle}</p>
                              </div>
                              
                              <div>
                                <h4 className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest mb-1">Tóm tắt</h4>
                                <p className="text-sm text-zinc-600 dark:text-dark-muted leading-relaxed italic">
                                  {story.summary || "Chưa có tóm tắt cho truyện này."}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest mb-2">Links</h4>
                                  <div className="flex flex-col gap-2">
                                    <a 
                                      href={story.links.original} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-dark-muted hover:text-brand-primary dark:hover:text-rose-400 transition-colors"
                                    >
                                      <LinkIcon className="w-3.5 h-3.5" />
                                      Bản gốc (AO3/Lofter)
                                    </a>
                                    <a 
                                      href={story.links.translation} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-dark-muted hover:text-brand-primary dark:hover:text-rose-400 transition-colors"
                                    >
                                      <Languages className="w-3.5 h-3.5" />
                                      Bản dịch (Wattpad/Wordpress)
                                    </a>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest mb-2">Chi tiết trạng thái</h4>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-zinc-500 dark:text-dark-muted">Tiến độ:</span>
                                      <span className="font-bold text-zinc-900 dark:text-dark-text">{story.chapters} chương ({story.isCompleted ? "Hoàn" : "Chưa hoàn"})</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-zinc-500 dark:text-dark-muted">Dịch:</span>
                                      <span className={`font-bold ${story.translationStatus === 'Done' ? 'text-teal-600 dark:text-teal-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{story.translationStatus}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-zinc-500 dark:text-dark-muted">Đọc:</span>
                                      <span className={`font-bold ${story.readingStatus === 'Done' ? 'text-teal-600 dark:text-teal-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{story.readingStatus}</span>
                                    </div>
                                    {story.wordCount > 0 && (
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-zinc-500 dark:text-dark-muted">Số chữ:</span>
                                        <span className="font-bold text-zinc-900 dark:text-dark-text">{story.wordCount.toLocaleString()} từ</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="pt-4 border-t border-rose-100 dark:border-rose-900/20 flex justify-end gap-3">
                                <button className="px-4 py-2 bg-white dark:bg-zinc-800 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold text-brand-primary dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
                                  Chỉnh sửa truyện
                                </button>
                                <button className="px-4 py-2 bg-brand-primary dark:bg-rose-600 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-rose-900/20 transition-all">
                                  Mở Link đọc
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {dynamicStats.map((stat, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-md rounded-3xl p-6 border border-white dark:border-dark-border flex items-center justify-between shadow-sm"
              >
                <div>
                  <p className="text-[10px] font-extrabold text-zinc-500 dark:text-dark-muted uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                </div>
                <div className="p-3 bg-white/80 dark:bg-zinc-800/50 rounded-2xl">
                  {stat.icon === 'Eye' && <Eye className={`w-8 h-8 ${stat.color} opacity-40`} />}
                  {stat.icon === 'ListOrdered' && <ListOrdered className={`w-8 h-8 ${stat.color} opacity-40`} />}
                  {stat.icon === 'Bookmark' && <Bookmark className={`w-8 h-8 ${stat.color} opacity-40`} />}
                  {stat.icon === 'UserPlus' && <UserPlus className={`w-8 h-8 ${stat.color} opacity-40`} />}
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  </main>

      {/* Quick Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white dark:border-dark-border"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                      <ClipboardPaste className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-dark-text">AI Quick Import</h2>
                      <p className="text-xs text-zinc-500 dark:text-dark-muted">Dán nội dung bất kỳ, AI sẽ tự động nhận diện thông tin</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsImportModalOpen(false)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-400 dark:text-dark-muted" />
                  </button>
                </div>

                <div className="bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl p-4 mb-6 border border-rose-100 dark:border-rose-900/20">
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    AI Smart Recognition
                  </p>
                  <p className="text-[11px] text-zinc-600 dark:text-dark-muted leading-relaxed">
                    Bạn có thể dán trực tiếp thông tin truyện từ AO3, Wattpad hoặc các trang web khác. 
                    Hệ thống sẽ tự động tìm <b>Tên truyện</b>, <b>Tác giả</b>, <b>Couple</b> và <b>Số chương</b>.
                  </p>
                </div>

                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Dán nội dung truyện tại đây (ví dụ: AO3 story block)..."
                  className={`w-full h-64 bg-zinc-50 dark:bg-zinc-800 border-2 border-dashed rounded-2xl p-4 text-sm focus:ring-2 transition-all resize-none text-zinc-800 dark:text-dark-text ${
                    importStatus === 'error' ? 'border-rose-300 dark:border-rose-900/50 focus:ring-rose-200 dark:focus:ring-rose-900/30 focus:border-rose-200' : 'border-zinc-200 dark:border-dark-border focus:ring-rose-200 dark:focus:ring-rose-900/30 focus:border-rose-200'
                  }`}
                />

                {importStatus === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-medium"
                  >
                    <X className="w-4 h-4" />
                    {importErrorMessage}
                  </motion.div>
                )}

                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={() => setIsImportModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold text-zinc-500 dark:text-dark-muted hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={handleQuickImport}
                    disabled={!importText.trim() || importStatus === 'loading' || importStatus === 'success'}
                    className={`flex-[2] px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      importStatus === 'success'
                        ? 'bg-teal-500 text-white'
                        : importStatus === 'error'
                        ? 'bg-rose-500 text-white'
                        : 'bg-brand-primary text-white hover:shadow-lg hover:shadow-rose-900/20 active:scale-95 disabled:opacity-50'
                    }`}
                  >
                    {importStatus === 'loading' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang phân tích...
                      </>
                    ) : importStatus === 'success' ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Đã nhập thành công!
                      </>
                    ) : importStatus === 'error' ? (
                      <>
                        <X className="w-5 h-5" />
                        Lỗi phân tích, thử lại
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Phân tích bằng AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active = false, className = "", onClick }: { icon: ReactNode, label: string, active?: boolean, className?: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 group whitespace-nowrap ${
        active 
          ? 'bg-white dark:bg-zinc-800 text-rose-500 dark:text-rose-400 shadow-md shadow-rose-900/5 font-bold' 
          : 'text-zinc-500 dark:text-dark-muted hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-zinc-800/50'
      } ${className}`}
    >
      <span className={`${active ? 'text-rose-500 dark:text-rose-400' : 'text-zinc-400 dark:text-zinc-600 group-hover:text-rose-400'}`}>
        {icon}
      </span>
      <span className="text-sm tracking-wide">{label}</span>
    </button>
  );
}
