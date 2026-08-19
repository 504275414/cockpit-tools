import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Package, Gift, Zap, MoreHorizontal } from 'lucide-react';
import type { TraeQuotaCategoryGroup, TraeQuotaResource } from '../../types/trae';

interface TraeQuotaCategoryListProps {
  groups: TraeQuotaCategoryGroup[];
  formatValue: (value: number, unit?: string) => string;
  formatDateTime: (timeMs: number | null) => string | null;
  variant?: 'card' | 'table';
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  base: <Package size={14} />,
  activity: <Gift size={14} />,
  extra: <Zap size={14} />,
  other: <MoreHorizontal size={14} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  base: '#3b82f6',
  activity: '#f59e0b',
  extra: '#8b5cf6',
  other: '#6b7280',
};

function getQuotaClass(remainPercent: number | null): string {
  if (remainPercent == null || !Number.isFinite(remainPercent)) return 'high';
  if (remainPercent <= 10) return 'critical';
  if (remainPercent <= 30) return 'low';
  if (remainPercent <= 60) return 'medium';
  return 'high';
}

export function TraeQuotaCategoryList({
  groups,
  formatValue,
  formatDateTime,
  variant = 'card',
}: TraeQuotaCategoryListProps) {
  const { t } = useTranslation();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const visibleGroups = groups.filter((g) => g.visible);

  if (visibleGroups.length === 0) {
    return (
      <div className="quota-category-empty">
        {t('common.shared.quota.noData', '暂无配额数据')}
      </div>
    );
  }

  return (
    <div className={`quota-category-list trae-quota-category-list ${variant === 'table' ? 'is-table' : 'is-card'}`}>
      {visibleGroups.map((group) => {
        const isExpanded = expandedKeys.has(group.key);
        const hasDetails = group.items.length > 1 || (group.items.length === 1 && Boolean(group.items[0].packageName));
        const totalText =
          group.total === -1
            ? t('trae.quota.unlimited', '无限')
            : formatValue(group.total, group.unit);
        const usedText = formatValue(group.used, group.unit);

        return (
          <div
            key={group.key}
            className={`quota-category-item ${getQuotaClass(group.remainPercent)}`}
          >
            {/* 分组头部 */}
            <div
              className="quota-category-header"
              onClick={() => hasDetails && toggleExpand(group.key)}
              style={{ cursor: hasDetails ? 'pointer' : 'default' }}
            >
              <div className="quota-category-info">
                <span
                  className="quota-category-icon"
                  style={{ color: CATEGORY_COLORS[group.key] || '#3b82f6' }}
                >
                  {CATEGORY_ICONS[group.key] || <Package size={14} />}
                </span>
                <span className="quota-category-label">{group.label}</span>
                {hasDetails && (
                  <span className="quota-category-count">({group.items.length})</span>
                )}
              </div>
              <div className="quota-category-stats">
                <span className="quota-category-value">
                  {usedText} / {totalText}
                </span>
                {hasDetails && (
                  <span className="quota-category-expand-icon">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                )}
              </div>
            </div>

            {/* 进度条 */}
            <div className="quota-category-progress">
              <div
                className={`quota-category-progress-bar ${getQuotaClass(group.remainPercent)}`}
                style={{ width: `${Math.min(100, group.usedPercent)}%` }}
              />
            </div>

            {/* 详情列表 - 展开时显示 */}
            {isExpanded && hasDetails && (
              <div className="quota-category-details">
                {group.items.map((item, idx) => (
                  <TraeQuotaItemDetail
                    key={`${group.key}-${idx}`}
                    item={item}
                    formatValue={formatValue}
                    formatDateTime={formatDateTime}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface TraeQuotaItemDetailProps {
  item: TraeQuotaResource;
  formatValue: (value: number, unit?: string) => string;
  formatDateTime: (timeMs: number | null) => string | null;
}

function TraeQuotaItemDetail({
  item,
  formatValue,
  formatDateTime,
}: TraeQuotaItemDetailProps) {
  const { t } = useTranslation();
  const remainPercent =
    item.remainPercent ??
    (item.total > 0 ? (item.available / item.total) * 100 : item.total === -1 ? 100 : null);

  let timeText = '';
  if (item.expireAt) {
    const formatted = formatDateTime(item.expireAt);
    if (formatted) {
      timeText = t('codebuddy.quotaQuery.expireAt', '到期时间：{{time}}', {
        time: formatted,
      });
    }
  } else if (item.refreshAt) {
    const formatted = formatDateTime(item.refreshAt);
    if (formatted) {
      timeText = t('codebuddy.quotaQuery.updatedAt', '下次刷新时间：{{time}}', {
        time: formatted,
      });
    }
  }

  const totalText =
    item.total === -1
      ? t('trae.quota.unlimited', '无限')
      : formatValue(item.total, item.unit);
  const usedText = formatValue(item.used, item.unit);

  return (
    <div className={`quota-category-detail-item ${getQuotaClass(remainPercent)}`}>
      <div className="quota-detail-header">
        <span className="quota-detail-name" title={item.packageName || ''}>
          {item.packageName || t('common.shared.quota.noData', '暂无配额数据')}
        </span>
        <span className={`quota-detail-value ${getQuotaClass(remainPercent)}`}>
          {usedText} / {totalText}
        </span>
      </div>
      {timeText && <div className="quota-detail-meta">{timeText}</div>}
    </div>
  );
}
