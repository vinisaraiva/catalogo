import { describe, expect, it } from "vitest";
import {
  deriveLastUsedModelId,
  selectModelAutomatically,
  selectPoseAutomatically,
  type SelectableAiModel,
  type SelectableAiModelPose,
} from "../ai-selection";

describe("deriveLastUsedModelId", () => {
  it("returns null when no pose has ever been used", () => {
    const poses: SelectableAiModelPose[] = [
      { id: "p1", aiModelId: "m1", active: true, usageCount: 0, lastUsedAt: null },
      { id: "p2", aiModelId: "m2", active: true, usageCount: 0, lastUsedAt: null },
    ];
    expect(deriveLastUsedModelId(poses)).toBeNull();
  });

  it("returns the model owning the most recently used pose", () => {
    const poses: SelectableAiModelPose[] = [
      {
        id: "p1",
        aiModelId: "m1",
        active: true,
        usageCount: 3,
        lastUsedAt: "2026-08-20T10:00:00Z",
      },
      {
        id: "p2",
        aiModelId: "m2",
        active: true,
        usageCount: 1,
        lastUsedAt: "2026-08-24T10:00:00Z",
      },
      { id: "p3", aiModelId: "m1", active: true, usageCount: 0, lastUsedAt: null },
    ];
    expect(deriveLastUsedModelId(poses)).toBe("m2");
  });
});

describe("selectModelAutomatically", () => {
  const models: SelectableAiModel[] = [
    { id: "m1", active: true },
    { id: "m2", active: true },
    { id: "m3", active: false },
  ];

  it("returns null when there is no active model", () => {
    expect(selectModelAutomatically([{ id: "m1", active: false }], null)).toBeNull();
  });

  it("picks any active model when there is no prior usage", () => {
    expect(selectModelAutomatically(models, null)).toBe("m1");
  });

  it("avoids repeating the last used model when another active one exists", () => {
    expect(selectModelAutomatically(models, "m1")).toBe("m2");
  });

  it("falls back to the last used model when it is the only active one", () => {
    const single: SelectableAiModel[] = [{ id: "m1", active: true }];
    expect(selectModelAutomatically(single, "m1")).toBe("m1");
  });

  it("ignores inactive models entirely, even as the 'last used' exclusion target", () => {
    // m3 is inactive and was (hypothetically) last used — it must never be
    // returned, and excluding it doesn't reduce the active candidate pool.
    expect(selectModelAutomatically(models, "m3")).toBe("m1");
  });
});

describe("selectPoseAutomatically", () => {
  it("returns null when the model has no active pose", () => {
    const poses: SelectableAiModelPose[] = [
      { id: "p1", aiModelId: "m1", active: false, usageCount: 0, lastUsedAt: null },
    ];
    expect(selectPoseAutomatically(poses, "m1")).toBeNull();
  });

  it("ignores poses belonging to a different model", () => {
    const poses: SelectableAiModelPose[] = [
      { id: "p1", aiModelId: "m2", active: true, usageCount: 0, lastUsedAt: null },
    ];
    expect(selectPoseAutomatically(poses, "m1")).toBeNull();
  });

  it("prefers the least-used pose", () => {
    const poses: SelectableAiModelPose[] = [
      {
        id: "p1",
        aiModelId: "m1",
        active: true,
        usageCount: 5,
        lastUsedAt: "2026-08-20T10:00:00Z",
      },
      {
        id: "p2",
        aiModelId: "m1",
        active: true,
        usageCount: 1,
        lastUsedAt: "2026-08-24T10:00:00Z",
      },
    ];
    expect(selectPoseAutomatically(poses, "m1")).toBe("p2");
  });

  it("prefers a never-used pose over a used one with equal usage count semantics", () => {
    const poses: SelectableAiModelPose[] = [
      {
        id: "p1",
        aiModelId: "m1",
        active: true,
        usageCount: 0,
        lastUsedAt: "2026-08-24T10:00:00Z",
      },
      { id: "p2", aiModelId: "m1", active: true, usageCount: 0, lastUsedAt: null },
    ];
    expect(selectPoseAutomatically(poses, "m1")).toBe("p2");
  });

  it("among equally-used poses, prefers the least recently used", () => {
    const poses: SelectableAiModelPose[] = [
      {
        id: "p1",
        aiModelId: "m1",
        active: true,
        usageCount: 2,
        lastUsedAt: "2026-08-24T10:00:00Z",
      },
      {
        id: "p2",
        aiModelId: "m1",
        active: true,
        usageCount: 2,
        lastUsedAt: "2026-08-20T10:00:00Z",
      },
    ];
    expect(selectPoseAutomatically(poses, "m1")).toBe("p2");
  });
});
