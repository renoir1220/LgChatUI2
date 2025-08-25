import React from 'react';
import { Descriptions, Tag, Typography, Space, Divider } from 'antd';
import { RichTextRenderer } from './RichTextRenderer';
import type { RequirementItem } from "@types";

const { Title, Paragraph } = Typography;

interface RequirementDetailProps {
  requirement: RequirementItem;
}


/**
 * 需求详情组件
 * 展示需求的完整信息
 */
export const RequirementDetail: React.FC<RequirementDetailProps> = ({
  requirement,
}) => {
  const {
    siteName,
    product,
    content,
    requirementEvaluation,
    designContent,
    productDescription,
    developmentDescription,
    creator,
    customerName,
    versionName,
    createDate,
    lastUpdateDate,
  } = requirement;

  const descriptionItems = [
    {
      key: 'siteName',
      label: '站点',
      span: 1,
      children: siteName || '-',
    },
    {
      key: 'creator',
      label: '创建人',
      span: 1, 
      children: creator || '-',
    },
    {
      key: 'createDate',
      label: '创建日期',
      span: 1,
      children: createDate || '-',
    },
    {
      key: 'lastUpdateDate',
      label: '最后更新',
      span: 1,
      children: lastUpdateDate || '-',
    },
  ];

  if (versionName) {
    descriptionItems.push({
      key: 'versionName',
      label: '版本号',
      span: 2,
      children: versionName,
    });
  }

  return (
    <div style={{ padding: '16px 0' }}>
      {/* 基本信息 */}
      <Descriptions
        size="small"
        column={2}
        items={descriptionItems}
        style={{ marginBottom: 16 }}
      />

      {/* 内容区块 */}
      {content && (
        <>
          <Title level={5} style={{ margin: '16px 0 8px 0', color: '#595959' }}>
            需求描述
          </Title>
          <RichTextRenderer content={content} />
        </>
      )}

      {requirementEvaluation && (
        <>
          <Title level={5} style={{ margin: '16px 0 8px 0', color: '#595959' }}>
            需求评估
          </Title>
          <RichTextRenderer content={requirementEvaluation} />
        </>
      )}

      {designContent && (
        <>
          <Title level={5} style={{ margin: '16px 0 8px 0', color: '#595959' }}>
            设计内容
          </Title>
          <RichTextRenderer content={designContent} />
        </>
      )}

      {productDescription && (
        <>
          <Title level={5} style={{ margin: '16px 0 8px 0', color: '#595959' }}>
            产品说明
          </Title>
          <RichTextRenderer content={productDescription} />
        </>
      )}

      {developmentDescription && (
        <>
          <Title level={5} style={{ margin: '16px 0 8px 0', color: '#595959' }}>
            研发说明
          </Title>
          <RichTextRenderer content={developmentDescription} />
        </>
      )}
    </div>
  );
};