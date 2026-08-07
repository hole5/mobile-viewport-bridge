export const MODE_META: Record<string, { title: string; hint: string }> = {
  preview: { title: '预览', hint: '中间为手机视窗；用顶部加载/刷新控制预览内容。' },
  devices: { title: '设备', hint: '选择 DEVICE_PRESETS，画布按视口宽高自动切换。' },
  inspect: { title: '检查', hint: '点击手机内元素或左侧节点列表选中；右侧改属性后「写入预览」。' },
  pending: { title: 'Pending', hint: '待回写队列 · 文本本地应用，样式/属性/位移交 Agent（含拖动网格对齐）。' },
  settings: { title: '设置', hint: '预览与编辑偏好，即时生效并写入 localStorage。' },
};

export type Pickable = {
  id: string;
  sel: string;
  label: string;
  desc: string;
  text: string;
  color: string;
  fontSize: string;
  fontWeight: string;
  width: string;
  height: string;
  display: string;
  borderRadius: string;
  margin: string;
  padding: string;
  src: string;
};

export const PICKABLES: Pickable[] = [
  { id: 't1', sel: 'h1.hero', label: '标题', desc: 'Mobile Viewport', text: 'Mobile Viewport', color: '#e2e8f0', fontSize: '20px', fontWeight: '700', width: 'auto', height: 'auto', display: 'block', borderRadius: '6px', margin: '0 0 6px', padding: '0', src: '' },
  { id: 'c1', sel: 'div.card#overview', label: '卡片', desc: '今日概览', text: '今日概览 — 点我选中', color: '#4deeea', fontSize: '14px', fontWeight: '500', width: 'auto', height: 'auto', display: 'block', borderRadius: '14px', margin: '0 0 12px', padding: '14px', src: '' },
  { id: 'c2', sel: 'div.card#cta', label: '按钮', desc: '开始体验', text: '开始体验', color: '#0a1a1f', fontSize: '15px', fontWeight: '700', width: 'auto', height: 'auto', display: 'block', borderRadius: '10px', margin: '0', padding: '0', src: '' },
];
