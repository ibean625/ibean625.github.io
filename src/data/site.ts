import YAML from 'yaml';
import configText from '../../_config.yml?raw';
import publicationText from '../../_data/publications.yml?raw';

export type Locale = 'en' | 'zh';
type PublicationSource = {
  title: string;
  authors: string;
  conference_short: string;
  conference: string;
  pdf: string;
  video?: string;
  image: string;
  page?: string;
  arxiv?: string;
  notes?: string;
};

const config = YAML.parse(configText);
const source = YAML.parse(publicationText) as { main: PublicationSource[] };

export const profile = {
  name: 'Chenxi Han',
  chineseName: '韩晨曦',
  url: 'https://ibean625.github.io',
  email: config.email as string,
  wechat: config.wechat as string,
  scholar: config.google_scholar as string,
  github: config.github_link as string,
  twitter: config.twitter as string,
  rednote: config.rednote as string,
  cv: { en: `/${config.cv_en_link}`, zh: `/${config.cv_zh_link}` },
};

export const copy = {
  en: {
    lang: 'en',
    title: 'Chenxi Han · Robot Learning',
    description: 'Chenxi Han, Ph.D. student at Tsinghua University and co-founder of ZERITH. Research in reinforcement learning, manipulation models, and humanoid robots.',
    skip: 'Skip to content',
    nav: { about: 'About', publications: 'Publications' },
    cv: 'View CV',
    contactDetails: 'Contact details',
    emailLabel: 'Email',
    wechatLabel: 'WeChat / Phone',
    rednoteLabel: 'Xiaohongshu',
    rednoteProfile: 'Profile',
    cvTitle: 'Curriculum vitae',
    cvClose: 'Close CV preview',
    cvZoomIn: 'Zoom in',
    cvZoomOut: 'Zoom out',
    cvFit: 'Fit to width',
    cvLoading: 'Loading CV…',
    cvLoadError: 'Unable to load this preview. Open the PDF to view it.',
    cvOpenPdf: 'Open PDF',
    themeDark: 'Switch to dark mode',
    themeLight: 'Switch to light mode',
    menuOpen: 'Open navigation',
    menuClose: 'Close navigation',
    language: 'Choose language',
    eyebrow: 'Robot learning & embodied intelligence',
    role: 'Ph.D. student',
    school: 'Tsinghua University',
    founder: 'Co-founder of',
    vision: 'Robots that act more precisely, work faster, and keep learning.',
    bio: 'Hi there! I’m Chenxi Han, a Ph.D. student at <a href="https://www.tsinghua.edu.cn/">Tsinghua University</a>. My research focuses on reinforcement learning, imitation learning, and manipulation models for humanoid robots. I am advised by Prof. Houde Liu at the <a href="https://www.sigs.tsinghua.edu.cn/lhd/list.htm">Tsinghua AI & Robot Lab</a> and co-founded <a href="https://zerith.ai/">ZERITH</a>, where I work on motion control and robot learning. I aim to enable robots to perform tasks more accurately and quickly in real-world settings while continually learning and improving.',
    interests: ['Reinforcement learning', 'Imitation learning', 'Manipulation models', 'Humanoid control'],
    interestsLabel: 'Research interests',
    portraitAlt: 'Chenxi Han',
    selected: 'Selected research',
    selectedIntro: 'Selected work in robot learning and humanoid control.',
    allPublications: 'All publications',
    project: 'Project',
    paper: 'Paper',
    video: 'Watch demo',
    enlargeFigure: 'Enlarge figure',
    playPreview: 'Play video preview',
    closePreview: 'Close preview',
    figureTab: 'Figure',
    videoTab: 'Video',
    openOriginal: 'Open original',
    videoError: 'This video could not be played here. You can open the original video instead.',
    publications: 'Publications',
    publicationsIntro: 'Selected papers on robot learning, design, and control.',
    overview: 'Overview',
    code: 'Code',
    preprint: 'arXiv preprint',
    oral: 'Oral pitch',
    career: 'Experience & education',
    careerIntro: 'Research and industry experience.',
    experience: 'Experience',
    education: 'Education',
    present: 'Present',
    honors: 'Honors & service',
    moreHonors: 'More honors',
    service: 'Reviewer for IEEE ICRA and IEEE Robotics and Automation Letters (RA-L).',
    contact: 'Let’s talk about robots.',
    contactIntro: 'Open to conversations about robot learning, manipulation, and real-world deployment.',
    contactAction: 'Get in touch',
    englishCV: 'CV · English',
    chineseCV: 'CV · 中文',
    footer: 'Research. Build. Learn.',
    backTop: 'Back to top',
    photoCaption: 'Tsinghua University · Shenzhen',
  },
  zh: {
    lang: 'zh-CN',
    title: '韩晨曦 · 机器人学习',
    description: '韩晨曦，清华大学博士研究生、零次方机器人联合创始人。研究方向为强化学习、操作模型与人形机器人控制。',
    skip: '跳至正文',
    nav: { about: '关于', publications: '学术论文' },
    cv: '查看简历',
    contactDetails: '联系方式',
    emailLabel: '邮箱',
    wechatLabel: '微信 / 手机',
    rednoteLabel: '小红书',
    rednoteProfile: '个人主页',
    cvTitle: '个人简历',
    cvClose: '关闭简历预览',
    cvZoomIn: '放大',
    cvZoomOut: '缩小',
    cvFit: '适应宽度',
    cvLoading: '正在加载简历…',
    cvLoadError: '暂时无法加载预览，请打开 PDF 查看。',
    cvOpenPdf: '打开 PDF',
    themeDark: '切换深色模式',
    themeLight: '切换浅色模式',
    menuOpen: '展开导航',
    menuClose: '收起导航',
    language: '选择语言',
    eyebrow: '机器人学习与具身智能',
    role: '博士研究生',
    school: '清华大学',
    founder: '联合创始人',
    vision: '让机器人在真实场景中，操作更准、更快，并持续进化。',
    bio: '你好，我是韩晨曦，<a href="https://www.tsinghua.edu.cn/">清华大学</a>博士研究生。我的研究方向是强化学习、模仿学习与人形机器人操作模型，在<a href="https://www.sigs.tsinghua.edu.cn/lhd/list.htm">清华大学 AI 与机器人实验室</a>师从刘厚德教授。我也是<a href="https://zerith.ai/">零次方机器人（ZERITH）</a>联合创始人，负责运动控制与机器人学习相关工作。我希望让机器人在真实场景中操作更准、更快，并通过持续学习不断进化。',
    interests: ['强化学习', '模仿学习', '操作模型', '人形机器人控制'],
    interestsLabel: '研究方向',
    portraitAlt: '韩晨曦',
    selected: '研究项目',
    selectedIntro: '机器人学习与人形机器人控制相关工作。',
    allPublications: '查看全部论文',
    project: '项目主页',
    paper: '论文',
    video: '演示视频',
    enlargeFigure: '放大配图',
    playPreview: '播放视频预览',
    closePreview: '关闭预览',
    figureTab: '配图',
    videoTab: '视频',
    openOriginal: '查看原文件',
    videoError: '暂时无法播放此视频，可以打开原视频查看。',
    publications: '学术论文',
    publicationsIntro: '围绕机器人学习、结构设计与运动控制的研究。',
    overview: '研究概述',
    code: '代码',
    preprint: 'arXiv 预印本',
    oral: '口头报告',
    career: '工作与教育经历',
    careerIntro: '科研与工程实践。',
    experience: '工作与科研',
    education: '教育背景',
    present: '至今',
    honors: '荣誉与学术服务',
    moreHonors: '更多荣誉',
    service: '担任 IEEE ICRA、IEEE Robotics and Automation Letters（RA-L）审稿人。',
    contact: '聊聊机器人。',
    contactIntro: '欢迎交流机器人学习、操作模型与真实场景落地。',
    contactAction: '邮件联系',
    englishCV: '英文简历',
    chineseCV: '中文简历',
    footer: '研究 · 实践 · 持续学习',
    backTop: '返回顶部',
    photoCaption: '清华大学 · 深圳',
  },
} as const;

export const summaries = {
  prior: {
    en: 'Combining parameterized gait priors with terrain perception for natural, terrain-adaptive humanoid locomotion.',
    zh: '融合参数化步态先验与地形感知，让人形机器人在复杂地形中走得更自然、更稳健。',
  },
  pmg: {
    en: 'A compact motion generator that synthesizes human-like reference trajectories for imitation and reinforcement learning.',
    zh: '以少量参数化运动数据生成拟人参考轨迹，结合模仿学习与强化学习实现人形机器人运动控制。',
  },
  serl: {
    en: 'Reinforcement learning and evolutionary search for lightweight bipedal robot design and improved locomotion.',
    zh: '结合强化学习与进化搜索，协同优化轻量化双足机器人的结构设计与运动性能。',
  },
  sewb: {
    en: 'A CBF-QP whole-body controller for safe, real-time collision avoidance with mobile manipulators in dynamic environments.',
    zh: '基于 CBF-QP 的全身控制方法，让移动机械臂在动态环境中实现实时、安全的避碰。',
  },
  fue: {
    en: 'A pneumatic mechanism with visual feedback for precise, automated follicular unit extraction surgery.',
    zh: '结合气动机构与视觉反馈，探索高精度自动化毛囊提取手术。',
  },
} as const;
type PaperId = keyof typeof summaries;

export const publications = source.main.map((paper) => {
  const id: PaperId = paper.title.startsWith('PRIOR') ? 'prior' : paper.title.startsWith('PMG') ? 'pmg' : paper.title.startsWith('Structural') ? 'serl' : paper.title.startsWith('Safe') ? 'sewb' : 'fue';
  return {
    ...paper,
    id,
    year: Number(paper.conference.match(/20\d{2}/)?.[0] ?? 2026),
    image: paper.image.replace(/^\.\//, '/').replace(/\.png$/, '.webp'),
    pdf: paper.pdf.replace(/^\.\//, '/'),
    video: paper.video?.replace(/^\.\//, '/'),
    summary: summaries[id],
    name: id === 'prior' ? 'PRIOR' : id === 'pmg' ? 'PMG' : id === 'serl' ? 'SERL' : '',
  };
}).sort((a, b) => b.year - a.year);

export const career = {
  en: {
    experience: [
      { title: 'Tsinghua AI & Robot Lab', role: 'Ph.D. researcher', period: '2024 — Present', description: 'Humanoid reference motion, whole-body control, and sim-to-real transfer.' },
      { title: 'ZERITH Robotics', role: 'Co-founder', period: '2024 — Present', description: 'Motion control, teleoperation, reinforcement learning, and manipulation models.' },
      { title: 'Shanghai University', role: 'Visiting researcher', period: '2023 — 2024', description: 'Humanoid robot design, control methods, and system validation.' },
    ],
    education: [
      { title: 'Tsinghua University', role: 'Ph.D. student · Artificial Intelligence', period: '2024 — Present', description: 'Shenzhen International Graduate School · Advisor: Prof. Houde Liu' },
      { title: 'Harbin Institute of Technology, Shenzhen', role: 'B.Eng. · Robotics Engineering', period: '2020 — 2024', description: 'Advisors: Prof. Wenfu Xu and Prof. Jiaole Wang' },
    ],
  },
  zh: {
    experience: [
      { title: '清华大学 AI 与机器人实验室', role: '博士研究生', period: '2024 — 至今', description: '拟人参考运动生成、全身运动控制与仿真到现实迁移。' },
      { title: '零次方机器人', role: '联合创始人', period: '2024 — 至今', description: '运动控制、遥操作、强化学习与机器人操作模型。' },
      { title: '上海大学', role: '访问学者', period: '2023 — 2024', description: '人形机器人结构设计、控制方法开发与系统验证。' },
    ],
    education: [
      { title: '清华大学', role: '博士研究生 · 人工智能', period: '2024 — 至今', description: '深圳国际研究生院 · 导师：刘厚德教授' },
      { title: '哈尔滨工业大学（深圳）', role: '工学学士 · 机器人工程', period: '2020 — 2024', description: '导师：徐文福教授、王焦乐教授' },
    ],
  },
};

export const honors = [
  { year: '2025', en: 'Venture50 · Forbes China Excellence in Family Services · GGII Golden Globe · BDA Product Design Award', zh: 'Venture50 · 福布斯中国家庭服务业卓越奖 · 高工金球奖 · BDA 产品设计奖', note: { en: 'For ZERITH', zh: '零次方机器人获奖' } },
  { year: '2024', en: 'Global 4th Place · IEEE ICRA Quadruped Robot Challenge', zh: 'IEEE ICRA 四足机器人挑战赛 · 全球第四名' },
  { year: '2024', en: 'Outstanding Graduate · Dean’s Scholarship (Top 1%)', zh: '优秀毕业生 · 院长奖学金（前 1%）' },
  { year: '2021', en: 'National Scholarship', zh: '国家奖学金' },
];

export const otherHonors = [
  { year: '2023', en: 'Huawei Scholarship', zh: '华为奖学金' },
  { year: '2022', en: 'First-Class Academic Scholarship (Top 5%)', zh: '一等奖学金（前 5%）' },
  { year: '2022', en: 'National First Prize · 15th CAD Competition', zh: '第十五届全国大学生先进成图技术与产品信息建模创新大赛 · 全国一等奖' },
  { year: '2022', en: 'National Second Prize · 24th CRAIC Competition', zh: '第二十四届中国机器人及人工智能大赛 · 全国二等奖' },
  { year: '2022', en: 'First Prize · Mathematics Competition', zh: '数学竞赛一等奖' },
];
