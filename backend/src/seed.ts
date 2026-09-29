export const seed = {
  "relicItem": [
    {
      "id": 1,
      "relic_code": "relic code 1",
      "name": "name 1",
      "era": "era 1",
      "material": "material 1",
      "collection_level": "LOW",
      "storage_location": "storage location 1",
      "current_condition": "current condition 1"
    },
    {
      "id": 2,
      "relic_code": "relic code 2",
      "name": "name 2",
      "era": "era 2",
      "material": "material 2",
      "collection_level": "MEDIUM",
      "storage_location": "storage location 2",
      "current_condition": "current condition 2"
    },
    {
      "id": 3,
      "relic_code": "relic code 3",
      "name": "name 3",
      "era": "era 3",
      "material": "material 3",
      "collection_level": "HIGH",
      "storage_location": "storage location 3",
      "current_condition": "current condition 3"
    }
  ],
  "damageRecord": [
    {
      "id": 1,
      "relic_id": 1,
      "damage_type": "FRAGILE",
      "position_desc": "position desc 1",
      "severity": "severity 1",
      "discovered_by": "discovered by 1",
      "discovered_at": "2026-06-11T09:00:00Z",
      "image_url": "/mock/image_url-1.png",
      "status": "SUBMITTED"
    },
    {
      "id": 2,
      "relic_id": 2,
      "damage_type": "DAMAGED",
      "position_desc": "position desc 2",
      "severity": "severity 2",
      "discovered_by": "discovered by 2",
      "discovered_at": "2026-06-12T09:00:00Z",
      "image_url": "/mock/image_url-2.png",
      "status": "APPROVED"
    },
    {
      "id": 3,
      "relic_id": 3,
      "damage_type": "IN_RESTORATION",
      "position_desc": "position desc 3",
      "severity": "severity 3",
      "discovered_by": "discovered by 3",
      "discovered_at": "2026-06-13T09:00:00Z",
      "image_url": "/mock/image_url-3.png",
      "status": "DRAFT"
    }
  ],
  "restorationPlan": [
    {
      "id": 1,
      "relic_id": 1,
      "damage_record_id": 1,
      "plan_title": "plan title 1",
      "method": "method 1",
      "risk_assessment": "risk assessment 1",
      "approval_status": "SUBMITTED",
      "owner_id": 1,
      "revision": 2
    },
    {
      "id": 2,
      "relic_id": 2,
      "damage_record_id": 2,
      "plan_title": "plan title 2",
      "method": "method 2",
      "risk_assessment": "risk assessment 2",
      "approval_status": "APPROVED",
      "owner_id": 2,
      "revision": 2
    },
    {
      "id": 3,
      "relic_id": 3,
      "damage_record_id": 3,
      "plan_title": "plan title 3",
      "method": "method 3",
      "risk_assessment": "risk assessment 3",
      "approval_status": "DRAFT",
      "owner_id": 3,
      "revision": 1
    }
  ],
  "restorationStep": [
    {
      "id": 1,
      "plan_id": 1,
      "step_order": "step order 1",
      "technique": "technique 1",
      "material_used": "material used 1",
      "operator_id": 1,
      "step_status": "SUBMITTED",
      "finished_at": "2026-06-11T09:00:00Z"
    },
    {
      "id": 2,
      "plan_id": 2,
      "step_order": "step order 2",
      "technique": "technique 2",
      "material_used": "material used 2",
      "operator_id": 2,
      "step_status": "APPROVED",
      "finished_at": "2026-06-12T09:00:00Z"
    },
    {
      "id": 3,
      "plan_id": 3,
      "step_order": "step order 3",
      "technique": "technique 3",
      "material_used": "material used 3",
      "operator_id": 3,
      "step_status": "DRAFT",
      "finished_at": "2026-06-13T09:00:00Z"
    }
  ],
  "imageVersion": [
    {
      "id": 1,
      "relic_id": 1,
      "plan_id": 1,
      "version_no": "version no 1",
      "image_type": "FRAGILE",
      "file_path": "file path 1",
      "capture_at": "2026-06-11T09:00:00Z",
      "note": "note 1"
    },
    {
      "id": 2,
      "relic_id": 2,
      "plan_id": 2,
      "version_no": "version no 2",
      "image_type": "DAMAGED",
      "file_path": "file path 2",
      "capture_at": "2026-06-12T09:00:00Z",
      "note": "note 2"
    },
    {
      "id": 3,
      "relic_id": 3,
      "plan_id": 3,
      "version_no": "version no 3",
      "image_type": "IN_RESTORATION",
      "file_path": "file path 3",
      "capture_at": "2026-06-13T09:00:00Z",
      "note": "note 3"
    }
  ],
  "offlineBatch": [
    {
      "id": 1,
      "batch_no": "BATCH-2026-0920-001",
      "plan_id": 1,
      "base_revision": 1,
      "status": "MERGED",
      "payload": {
        "steps": [
          { "step_order": 1, "technique": "表面清理", "material_used": "软毛刷、去离子水", "operator_id": 1, "step_status": "DRAFT", "finished_at": "2026-09-20T10:00:00Z" }
        ],
        "images": [
          { "relic_id": 1, "plan_id": 1, "version_no": "offline-001", "image_type": "BEFORE", "file_path": "/offline/batch-001-1.png", "capture_at": "2026-09-20T10:05:00Z", "note": "修复前影像" }
        ]
      },
      "created_by": 1,
      "created_at": "2026-09-20T09:30:00Z",
      "merged_at": "2026-09-20T11:00:00Z",
      "result": { "merged_steps": 1, "merged_images": 1, "revision": 2 },
      "conflict_details": null,
      "retry_count": 0
    },
    {
      "id": 2,
      "batch_no": "BATCH-2026-0921-002",
      "plan_id": 2,
      "base_revision": 1,
      "status": "CONFLICT",
      "payload": {
        "steps": [
          { "step_order": 1, "technique": "加固处理", "material_used": "丙烯酸树脂", "operator_id": 2, "step_status": "DRAFT", "finished_at": "2026-09-21T14:00:00Z" }
        ],
        "images": []
      },
      "created_by": 2,
      "created_at": "2026-09-21T13:30:00Z",
      "merged_at": null,
      "result": null,
      "conflict_details": {
        "base_revision": 1,
        "current_revision": 2,
        "conflicting_steps": [1],
        "conflicting_images": [],
        "message": "方案基线已变更，离线内容另存为冲突副本"
      },
      "retry_count": 0
    },
    {
      "id": 3,
      "batch_no": "BATCH-2026-0922-003",
      "plan_id": 3,
      "base_revision": 1,
      "status": "FAILED",
      "payload": {
        "steps": [],
        "images": [
          { "relic_id": 3, "plan_id": 3, "version_no": "offline-003", "image_type": "AFTER", "file_path": "/offline/batch-003-1.png", "capture_at": "2026-09-22T16:00:00Z", "note": "修复后影像" }
        ]
      },
      "created_by": 3,
      "created_at": "2026-09-22T15:30:00Z",
      "merged_at": null,
      "result": null,
      "conflict_details": { "error": "PLAN_NOT_FOUND" },
      "retry_count": 1
    },
    {
      "id": 4,
      "batch_no": "BATCH-2026-0923-004",
      "plan_id": 1,
      "base_revision": 2,
      "status": "PENDING",
      "payload": {
        "steps": [
          { "step_order": 2, "technique": "补色处理", "material_used": "矿物颜料", "operator_id": 1, "step_status": "DRAFT", "finished_at": "2026-09-23T10:00:00Z" }
        ],
        "images": [
          { "relic_id": 1, "plan_id": 1, "version_no": "offline-004", "image_type": "PROCESS", "file_path": "/offline/batch-004-1.png", "capture_at": "2026-09-23T10:10:00Z", "note": "补色过程" }
        ]
      },
      "created_by": 1,
      "created_at": "2026-09-23T09:00:00Z",
      "merged_at": null,
      "result": null,
      "conflict_details": null,
      "retry_count": 0
    }
  ]
} as const;
