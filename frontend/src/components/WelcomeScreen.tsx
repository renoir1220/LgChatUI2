import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Lightbulb, 
  Zap, 
  FileText, 
  MessageSquare, 
  Code, 
  Calculator,
  BookOpen,
  Globe
} from 'lucide-react';

interface WelcomeScreenProps {
  onSendMessage: (message: string) => void;
  className?: string;
}

const quickPrompts = [
  {
    icon: Lightbulb,
    title: '创意助手',
    description: '帮我想一些创新的产品idea',
    message: '请帮我想一些有创意的产品想法，最好是解决日常生活中痛点的',
  },
  {
    icon: Code,
    title: '编程助手',
    description: '写一个React组件',
    message: '请帮我写一个React组件，实现一个带搜索功能的用户列表',
  },
  {
    icon: FileText,
    title: '文档写作',
    description: '撰写技术文档',
    message: '请帮我写一份API接口文档的模板，包含请求参数、响应格式等',
  },
  {
    icon: Calculator,
    title: '数据分析',
    description: '分析业务数据',
    message: '如何分析电商网站的用户行为数据，提高转化率？',
  },
  {
    icon: BookOpen,
    title: '学习助手',
    description: '解释复杂概念',
    message: '请用简单易懂的方式解释什么是微服务架构',
  },
  {
    icon: Globe,
    title: '翻译助手',
    description: '多语言翻译',
    message: '请帮我翻译这段话：Hello, how are you today?',
  },
];

export function WelcomeScreen({ onSendMessage, className }: WelcomeScreenProps) {
  const handlePromptClick = (message: string) => {
    onSendMessage(message);
  };

  return (
    <div className={cn('flex-1 flex items-center justify-center p-6', className)}>
      <div className="max-w-4xl w-full">
        {/* 欢迎信息 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            欢迎使用 LG Chat
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            智能助手随时为您服务
          </p>
          <p className="text-sm text-gray-500">
            选择下面的快捷指令开始对话，或者直接在下方输入您的问题
          </p>
        </div>

        {/* 功能特点 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">快速响应</h3>
              <p className="text-sm text-gray-600">实时流式对话体验</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <BookOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">知识库支持</h3>
              <p className="text-sm text-gray-600">基于专业知识回答</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Globe className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">多场景应用</h3>
              <p className="text-sm text-gray-600">适用各种工作场景</p>
            </CardContent>
          </Card>
        </div>

        {/* 快捷指令 */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            快速开始
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickPrompts.map((prompt, index) => (
              <Card
                key={index}
                className="cursor-pointer transition-all hover:shadow-md hover:scale-105 border-gray-200"
                onClick={() => handlePromptClick(prompt.message)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <prompt.icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium text-gray-900">
                        {prompt.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm text-gray-600">
                    {prompt.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 使用提示 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            💡 提示：您可以随时通过侧边栏创建新对话或查看历史记录
          </p>
        </div>
      </div>
    </div>
  );
}