import React from 'react';
import ReactMarkdown from 'react-markdown';
// GitHub 风格样式
import 'github-markdown-css/github-markdown.css';
import './welcome-markdown.css';
// 以原始文本方式引入，便于热重载
// 路径从 components 定位到 frontend 根目录
// frontend/src/features/chat/components -> ../../../../welcome_text.md
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - vite ?raw 支持
import rawMd from '../../../../welcome_text.md?raw';

export const WelcomeMarkdown: React.FC = () => {
  const [md, setMd] = React.useState<string>(rawMd as string);

  // 支持 Vite HMR：更新 markdown 时无刷新生效
  React.useEffect(() => {
    // @ts-ignore
    if (import.meta.hot) {
      // @ts-ignore
      import.meta.hot.accept((mod: any) => {
        if (mod?.default && typeof mod.default === 'string') {
          setMd(mod.default);
        }
      });
    }
  }, []);

  return (
    <div className="markdown-body" style={{
      width: '100%',
      maxWidth: 820,
      padding: '8px 4px',
      background: 'transparent',
      border: 'none',
      borderRadius: 0,
      boxShadow: 'none'
    }}>
      <ReactMarkdown>{md}</ReactMarkdown>
    </div>
  );
};

export default WelcomeMarkdown;
