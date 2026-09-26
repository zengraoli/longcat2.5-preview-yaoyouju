import { Injectable, OnModuleInit } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { getDb } from './database.module';
import { getIdentityDb } from './identity-database.module';
import { EncryptionService } from './encryption.service';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly encryptionService: EncryptionService) {}

  onModuleInit() {
    this.createTables();
    this.seed();
  }

  private createTables() {
    const db = getDb();
    const identityDb = getIdentityDb();
    identityDb.exec(`
      CREATE TABLE IF NOT EXISTS identity_profile (
        user_id TEXT PRIMARY KEY,
        phone_hash TEXT,
        phone_enc TEXT NOT NULL,
        real_name_enc TEXT NOT NULL
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        status TEXT DEFAULT 'active',
        created_at TEXT NOT NULL,
        retention_until TEXT
      );

      CREATE TABLE IF NOT EXISTS episode (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id),
        title TEXT NOT NULL,
        onset_date TEXT,
        onset_certainty TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS care_event (
        id TEXT PRIMARY KEY,
        episode_id TEXT NOT NULL REFERENCES episode(id),
        event_type TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        reported_at TEXT NOT NULL,
        source_type TEXT NOT NULL,
        raw_text TEXT,
        verify_status TEXT DEFAULT '尚未确认'
      );

      CREATE TABLE IF NOT EXISTS report (
        id TEXT PRIMARY KEY,
        care_event_id TEXT NOT NULL REFERENCES care_event(id),
        report_date TEXT NOT NULL,
        raw_text TEXT NOT NULL,
        extracted_terms TEXT,
        oss_key TEXT
      );

      CREATE TABLE IF NOT EXISTS symptom_log (
        id TEXT PRIMARY KEY,
        care_event_id TEXT NOT NULL REFERENCES care_event(id),
        sit_minutes INTEGER,
        planned_activity_done TEXT,
        sleep_impact INTEGER,
        top_worry TEXT,
        leg_change TEXT DEFAULT '尚未确认'
      );

      CREATE TABLE IF NOT EXISTS analysis (
        id TEXT PRIMARY KEY,
        episode_id TEXT NOT NULL REFERENCES episode(id),
        version INTEGER NOT NULL,
        model_release_id TEXT,
        sections TEXT NOT NULL,
        retrieval_snapshot TEXT,
        safety_flag TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS analysis_citation (
        id TEXT PRIMARY KEY,
        analysis_id TEXT NOT NULL REFERENCES analysis(id),
        evidence_doc_id TEXT NOT NULL,
        statement TEXT NOT NULL,
        supported INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS followup_summary (
        id TEXT PRIMARY KEY,
        episode_id TEXT NOT NULL REFERENCES episode(id),
        content TEXT NOT NULL,
        export_format TEXT,
        exported_at TEXT
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        analysis_id TEXT NOT NULL REFERENCES analysis(id),
        help_type TEXT NOT NULL,
        unsolved_question TEXT,
        is_error_report INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS safety_event (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id),
        rule_code TEXT NOT NULL,
        severity TEXT NOT NULL,
        action_taken TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS evidence_doc (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_url TEXT,
        license TEXT,
        verified_at TEXT,
        active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS evidence_chunk (
        id TEXT PRIMARY KEY,
        doc_id TEXT NOT NULL REFERENCES evidence_doc(id),
        content TEXT NOT NULL,
        embedding TEXT,
        position INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS content_item (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        applicable_scope TEXT,
        not_applicable TEXT,
        current_status TEXT DEFAULT '草稿',
        offline_switch INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS content_version (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL REFERENCES content_item(id),
        version INTEGER NOT NULL,
        script TEXT,
        asset_key TEXT,
        subtitle_text TEXT,
        model_asset_version TEXT,
        published_at TEXT
      );

      CREATE TABLE IF NOT EXISTS review_record (
        id TEXT PRIMARY KEY,
        target_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        reviewer_id TEXT NOT NULL,
        decision TEXT NOT NULL,
        review_scope TEXT,
        comment TEXT,
        reviewed_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS admin_user (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role_id TEXT NOT NULL,
        mfa_enabled INTEGER DEFAULT 1,
        failed_attempts INTEGER DEFAULT 0,
        locked_until TEXT
      );

      CREATE TABLE IF NOT EXISTS admin_session (
        id TEXT PRIMARY KEY,
        admin_user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS role (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        permissions TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        actor_id TEXT NOT NULL,
        action TEXT NOT NULL,
        target TEXT,
        diff TEXT,
        created_at TEXT NOT NULL,
        hash TEXT,
        prev_hash TEXT
      );

      CREATE TABLE IF NOT EXISTS model_release (
        id TEXT PRIMARY KEY,
        model_name TEXT NOT NULL,
        prompt_version TEXT NOT NULL,
        retrieval_strategy TEXT NOT NULL,
        content_lib_version TEXT NOT NULL,
        status TEXT DEFAULT '灰度'
      );

      CREATE TABLE IF NOT EXISTS eval_run (
        id TEXT PRIMARY KEY,
        model_release_id TEXT NOT NULL REFERENCES model_release(id),
        eval_set_id TEXT NOT NULL,
        metrics TEXT,
        result TEXT DEFAULT '通过'
      );

      CREATE TABLE IF NOT EXISTS eval_set (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        case_count INTEGER DEFAULT 0,
        deidentified INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS feature_switch (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL,
        enabled INTEGER DEFAULT 0,
        reason TEXT
      );

      CREATE TABLE IF NOT EXISTS case_submission (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id),
        edited_content TEXT NOT NULL,
        consent_scope TEXT,
        status TEXT DEFAULT '待审'
      );

      CREATE TABLE IF NOT EXISTS consent (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id),
        scope TEXT NOT NULL,
        granted_at TEXT NOT NULL,
        revoked_at TEXT
      );

      CREATE TABLE IF NOT EXISTS user_session (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id),
        phone_enc TEXT NOT NULL,
        token TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS analysis_task (
        id TEXT PRIMARY KEY,
        episode_id TEXT NOT NULL REFERENCES episode(id),
        user_id TEXT NOT NULL REFERENCES "user"(id),
        report_id TEXT,
        status TEXT DEFAULT 'queued',
        analysis_id TEXT,
        safety_flag TEXT,
        safety_message TEXT,
        retry_count INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS qa_session (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id),
        episode_id TEXT NOT NULL REFERENCES episode(id),
        analysis_id TEXT,
        question TEXT NOT NULL,
        answer TEXT,
        is_out_of_scope INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS error_report (
        id TEXT PRIMARY KEY,
        feedback_id TEXT NOT NULL,
        severity TEXT NOT NULL,
        category TEXT,
        description TEXT,
        analysis_version INTEGER,
        model_version TEXT,
        content_version TEXT,
        rule_set_version TEXT,
        status TEXT DEFAULT 'open',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS feedback_view_grant (
        id TEXT PRIMARY KEY,
        feedback_id TEXT NOT NULL,
        grantee_id TEXT NOT NULL,
        granted_at TEXT NOT NULL
      );
    `);
    this.migrate();
  }

  /**
   * 轻量迁移：为旧库补充 episode.created_at 列（接口按创建时间排序依赖该列）。
   */
  private migrate() {
    const db = getDb();
    const cols = db.prepare('PRAGMA table_info(episode)').all() as { name: string }[];
    if (!cols.some((c) => c.name === 'created_at')) {
      db.exec('ALTER TABLE episode ADD COLUMN created_at TEXT');
      db.exec(`UPDATE episode SET created_at = COALESCE(
        (SELECT MIN(occurred_at) FROM care_event WHERE care_event.episode_id = episode.id),
        '2026-05-01T00:00:00.000Z'
      ) WHERE created_at IS NULL`);
    }

    // phone_enc 使用随机 IV，不能直接用于等值查询；补充 sha256 盲索引列用于登录匹配。
    const identityDb = getIdentityDb();
    const idCols = identityDb.prepare('PRAGMA table_info(identity_profile)').all() as { name: string }[];
    if (!idCols.some((c) => c.name === 'phone_hash')) {
      identityDb.exec('ALTER TABLE identity_profile ADD COLUMN phone_hash TEXT');
      const rows = identityDb.prepare('SELECT user_id, phone_enc FROM identity_profile').all() as { user_id: string; phone_enc: string }[];
      for (const row of rows) {
        try {
          const phone = this.encryptionService.decrypt(row.phone_enc);
          identityDb.prepare('UPDATE identity_profile SET phone_hash = ? WHERE user_id = ?')
            .run(createHash('sha256').update(phone).digest('hex'), row.user_id);
        } catch {
          // 密文无法解开的旧行保持 NULL，不影响新数据
        }
      }
    }
  }

  private seed() {
    const db = getDb();
    const identityDb = getIdentityDb();
    const now = new Date().toISOString();

    const userCount = db.prepare('SELECT COUNT(*) as cnt FROM "user"').get() as { cnt: number } | undefined;
    if (userCount && userCount.cnt > 0) return;

    const insertUser = db.prepare('INSERT INTO "user" (id, status, created_at, retention_until) VALUES (?, ?, ?, ?)');
    const insertEpisode = db.prepare('INSERT INTO episode (id, user_id, title, onset_date, onset_certainty, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const insertCareEvent = db.prepare('INSERT INTO care_event (id, episode_id, event_type, occurred_at, reported_at, source_type, raw_text, verify_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const insertReport = db.prepare('INSERT INTO report (id, care_event_id, report_date, raw_text, extracted_terms, oss_key) VALUES (?, ?, ?, ?, ?, ?)');
    const insertSymptomLog = db.prepare('INSERT INTO symptom_log (id, care_event_id, sit_minutes, planned_activity_done, sleep_impact, top_worry, leg_change) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const insertAnalysis = db.prepare('INSERT INTO analysis (id, episode_id, version, model_release_id, sections, retrieval_snapshot, safety_flag, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const insertCitation = db.prepare('INSERT INTO analysis_citation (id, analysis_id, evidence_doc_id, statement, supported) VALUES (?, ?, ?, ?, ?)');
    const insertContentItem = db.prepare('INSERT INTO content_item (id, type, title, applicable_scope, not_applicable, current_status, offline_switch) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const insertContentVersion = db.prepare('INSERT INTO content_version (id, item_id, version, script, asset_key, subtitle_text, model_asset_version, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const insertReviewRecord = db.prepare('INSERT INTO review_record (id, target_id, target_type, reviewer_id, decision, review_scope, comment, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const insertEvidenceDoc = db.prepare('INSERT INTO evidence_doc (id, title, source_type, source_url, license, verified_at, active) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const insertEvidenceChunk = db.prepare('INSERT INTO evidence_chunk (id, doc_id, content, embedding, position) VALUES (?, ?, ?, ?, ?)');
    const insertRole = db.prepare('INSERT INTO role (id, name, permissions) VALUES (?, ?, ?)');
    const insertAdminUser = db.prepare('INSERT INTO admin_user (id, name, role_id, mfa_enabled) VALUES (?, ?, ?, ?)');
    const insertFeatureSwitch = db.prepare('INSERT INTO feature_switch (id, key, enabled, reason) VALUES (?, ?, ?, ?)');
    const insertEvalSet = db.prepare('INSERT INTO eval_set (id, name, case_count, deidentified) VALUES (?, ?, ?, ?)');
    const insertModelRelease = db.prepare('INSERT INTO model_release (id, model_name, prompt_version, retrieval_strategy, content_lib_version, status) VALUES (?, ?, ?, ?, ?, ?)');
    const insertConsent = db.prepare('INSERT INTO consent (id, user_id, scope, granted_at, revoked_at) VALUES (?, ?, ?, ?, ?)');
    const insertIdentity = identityDb.prepare('INSERT INTO identity_profile (user_id, phone_hash, phone_enc, real_name_enc) VALUES (?, ?, ?, ?)');

    const seedAll = db.transaction(() => {
      const user1Id = randomUUID();
      const user2Id = randomUUID();

      insertUser.run(user1Id, 'active', now, null);
      insertUser.run(user2Id, 'active', now, null);

      insertIdentity.run(user1Id, createHash('sha256').update('13800001111').digest('hex'), this.encryptionService.encrypt('13800001111'), this.encryptionService.encrypt('张三'));
      insertIdentity.run(user2Id, createHash('sha256').update('13900002222').digest('hex'), this.encryptionService.encrypt('13900002222'), this.encryptionService.encrypt('李四'));

      const episode1Id = randomUUID();
      const episode2Id = randomUUID();
      insertEpisode.run(episode1Id, user1Id, '腰痛三个月', '2026-06-01', '已确认', 'active', now);
      insertEpisode.run(episode2Id, user2Id, '腰椎间盘突出', '2026-05-15', '已确认', 'active', now);

      const event1Id = randomUUID();
      insertCareEvent.run(event1Id, episode1Id, '报告', '2026-07-10', now, '报告原文', '腰椎MRI显示L4/5椎间盘突出，硬膜囊受压', '已确认');

      insertReport.run(randomUUID(), event1Id, '2026-07-10', '腰椎MRI：L4/5椎间盘中央型突出，硬膜囊及双侧神经根受压，椎管轻度狭窄。', JSON.stringify([{ term: 'L4/5', position: '椎间盘' }, { term: '硬膜囊受压', position: '描述' }]), null);

      const symptomId = randomUUID();
      insertSymptomLog.run(symptomId, event1Id, 30, '完成散步20分钟', 2, '担心久坐加重', '无');

      const analysis1Id = randomUUID();
      const modelReleaseId = randomUUID();
      insertModelRelease.run(modelReleaseId, 'yaoyouju-analysis-v1', 'p-2026.06', 'keyword+vector', 'cl-v2', '生效');

      insertAnalysis.run(analysis1Id, episode1Id, 1, modelReleaseId, JSON.stringify({
        known: ['L4/5椎间盘突出', '硬膜囊受压'],
        explanation: [{ text: '椎间盘突出是椎间盘髓核向外膨出，压迫周围结构', source: 'evidence-doc-1' }],
        unknown: ['突出的具体程度', '保守治疗的效果'],
        nextSteps: ['避免久坐，每30分钟活动', '可咨询医生是否需要物理治疗'],
        video: null,
      }), JSON.stringify({ docIds: ['evidence-doc-1'], chunkIds: ['chunk-1'] }), 'pass', now);

      insertCitation.run(randomUUID(), analysis1Id, 'evidence-doc-1', '椎间盘突出是常见退行性改变', 1);

      insertEvidenceDoc.run('evidence-doc-1', '腰椎间盘突出诊疗指南', '指南', 'https://example.com/guideline', 'CC-BY-4.0', '2026-01-15', 1);
      insertEvidenceDoc.run('evidence-doc-2', '慢性腰痛运动疗法研究', '研究', 'https://example.com/study1', 'CC-BY-4.0', '2026-02-20', 1);
      insertEvidenceDoc.run('evidence-doc-3', '腰椎MRI影像解读', '审核科普', null, '内部', '2026-03-10', 1);
      insertEvidenceDoc.run('evidence-doc-4', '非特异性腰痛共识', '指南', 'https://example.com/consensus', 'CC-BY-SA-4.0', '2026-01-20', 1);
      insertEvidenceDoc.run('evidence-doc-5', '腰痛患者日常注意事项', '审核科普', null, '内部', '2026-04-05', 1);
      insertEvidenceDoc.run('evidence-doc-6', '椎间盘退变机制', '研究', 'https://example.com/study2', 'CC-BY-4.0', '2026-05-12', 1);

      insertEvidenceChunk.run('chunk-1', 'evidence-doc-1', '腰椎间盘突出症是指椎间盘髓核向外突出，压迫神经根或硬膜囊引起症状。', null, 1);
      insertEvidenceChunk.run('chunk-2', 'evidence-doc-1', '大多数患者通过保守治疗可缓解症状，仅少数需要手术干预。', null, 2);
      insertEvidenceChunk.run('chunk-3', 'evidence-doc-2', '规律运动可改善慢性腰痛患者的功能状态和疼痛评分。', null, 1);
      insertEvidenceChunk.run('chunk-4', 'evidence-doc-3', 'MRI上T2加权像信号减低提示椎间盘退变。', null, 1);
      insertEvidenceChunk.run('chunk-5', 'evidence-doc-4', '非特异性腰痛以保守治疗为主，包括运动疗法、手法治疗等。', null, 1);
      insertEvidenceChunk.run('chunk-6', 'evidence-doc-5', '腰痛患者避免久坐，建议每30分钟起身活动。', null, 1);

      const contentItems = [
        { id: 'content-1', type: '视频', title: '认识腰椎间盘突出', scope: '适用于腰椎间盘突出初步了解', notApplicable: '不适用于急性期疼痛严重者', status: '已发布' },
        { id: 'content-2', type: '图文组件', title: '日常腰部保护姿势', scope: '适用于日常姿势纠正', notApplicable: '不适用于术后康复期', status: '已发布' },
        { id: 'content-3', type: '视频', title: '办公室腰部锻炼操', scope: '适用于久坐办公人群', notApplicable: '不适用于急性疼痛期', status: '已审定' },
        { id: 'content-4', type: '视频', title: '慢性腰痛运动康复', scope: '适用于慢性腰痛患者', notApplicable: '不适用于未确诊的腰痛', status: '待医学审核' },
        { id: 'content-5', type: '图文组件', title: '腰痛患者睡眠姿势', scope: '适用于腰痛患者日常睡眠', notApplicable: '无特殊禁忌', status: '草稿' },
        { id: 'content-6', type: '视频', title: '腰椎MRI报告解读', scope: '适用于已做MRI检查的患者', notApplicable: '不适用于未做影像检查者', status: '已发布' },
        { id: 'content-7', type: '图文组件', title: '复诊准备清单', scope: '适用于即将复诊的患者', notApplicable: '无', status: '已发布' },
        { id: 'content-8', type: '视频', title: '非特异性腰痛自我管理', scope: '适用于非特异性腰痛', notApplicable: '不适用于有明确器质性病变者', status: '已撤回或已下线' },
        { id: 'content-9', type: '图文组件', title: '腰痛与体重管理', scope: '适用于超重腰痛患者', notApplicable: '不适用于体重正常者', status: '已发布' },
        { id: 'content-10', type: '视频', title: '物理治疗介绍', scope: '适用于考虑物理治疗的患者', notApplicable: '不适用于急性炎症期', status: '更正中' },
      ];

      const reviewerId = randomUUID();
      insertRole.run('role-1', '运营编辑', JSON.stringify(['content:create', 'content:edit', 'content:submit']));
      insertRole.run('role-2', '临床审核', JSON.stringify(['content:review', 'content:approve']));
      insertRole.run('role-3', '技术', JSON.stringify(['system:config', 'feature:toggle']));
      insertRole.run('role-4', '合规', JSON.stringify(['audit:view', 'safety:view']));
      insertRole.run('role-5', '超级管理', JSON.stringify(['*']));

      insertAdminUser.run(reviewerId, '运营编辑员', 'role-1', 1);
      insertAdminUser.run(randomUUID(), '临床审核员', 'role-2', 1);
      insertAdminUser.run(randomUUID(), '技术员', 'role-3', 1);
      insertAdminUser.run(randomUUID(), '合规专员', 'role-4', 1);
      insertAdminUser.run(randomUUID(), '超级管理员', 'role-5', 1);

      for (const item of contentItems) {
        insertContentItem.run(item.id, item.type, item.title, item.scope, item.notApplicable, item.status, 0);
        const versionNum = Math.floor(Math.random() * 3) + 1;
        insertContentVersion.run(
          randomUUID(),
          item.id,
          versionNum,
          `${item.title} 脚本内容：本视频旨在帮助用户理解${item.title}的相关知识。`,
          `assets/${item.id}/v${versionNum}`,
          `${item.title} 字幕文本`,
          `av-v${versionNum}`,
          item.status === '已发布' ? now : null,
        );
      }

      insertReviewRecord.run(randomUUID(), 'content-1', 'content_item', reviewerId, '通过', '医学准确性', '内容符合指南推荐', now);
      insertReviewRecord.run(randomUUID(), 'content-2', 'content_item', reviewerId, '通过', '医学准确性', '内容符合指南推荐', now);

      insertFeatureSwitch.run(randomUUID(), 'personalized_analysis', 1, '默认开启个性化分析');
      insertFeatureSwitch.run(randomUUID(), 'video_recommendation', 1, '默认开启视频推荐');
      insertFeatureSwitch.run(randomUUID(), 'case_card', 0, '案例卡片功能灰度中');

      insertEvalSet.run('eval-1', '错误安慰与关键遗漏', 50, 1);
      insertEvalSet.run('eval-2', '左右侧混淆测试', 30, 1);
      insertEvalSet.run('eval-3', '隐私保护测试', 20, 1);

      insertConsent.run(randomUUID(), user1Id, '健康信息处理', now, null);
      insertConsent.run(randomUUID(), user2Id, '健康信息处理', now, null);
    });

    seedAll();
  }
}
