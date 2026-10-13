import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { APIKEY_FUN_FAMILIES, buildCodexConfigToml } from './apikeyFunClientConfigs';

const family = (id: string) => {
  const preset = APIKEY_FUN_FAMILIES.find((entry) => entry.id === id);
  assert.ok(preset, `missing family ${id}`);
  return preset;
};

test('codex config derives the auto compact limit as 90% of the context window', () => {
  const catalog = JSON.parse(readFileSync(new URL('../../sidecars/cockpit-cliproxy/third_party/CLIProxyAPI/internal/registry/models/codex_client_models.json', import.meta.url), 'utf8'));
  const codexTemplate = catalog.models.find((model: { slug: string }) => model.slug === family('codex').fallbackModel);
  assert.ok(codexTemplate, 'Codex family model template');
  for (const [id, contextWindow] of [
    ['codex', codexTemplate.context_window],
    ['glm', 1000000],
    ['kimi', 1000000],
    ['deepseek', 1000000],
  ] as const) {
    const toml = buildCodexConfigToml({
      family: family(id),
      client: 'codex_cli',
      model: family(id).fallbackModel,
    });
    const expected = Math.floor((contextWindow * 90) / 100);
    assert.ok(toml.includes(`model_context_window = ${contextWindow}`), id);
    assert.ok(toml.includes(`model_auto_compact_token_limit = ${expected}`), id);
    // 压缩阈值必须严格小于上下文窗口，否则永远不会触发压缩。
    assert.ok(expected < contextWindow, id);
  }
});
