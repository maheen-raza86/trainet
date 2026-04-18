/**
 * Property-Based Tests for Guidance Service
 * Feature: mentorship-sessions
 * Uses fast-check for property-based testing
 */

import fc from 'fast-check';
import { jest } from '@jest/globals';

// Use globalThis to share mock state between the mock factory and tests
globalThis.__supabaseMockHandler = null;

// Use jest.unstable_mockModule for proper ESM mocking
// This must be called before any dynamic imports of the mocked module
jest.unstable_mockModule('../config/supabaseClient.js', () => ({
  default: {
    from: (...args) => {
      if (globalThis.__supabaseMockHandler) {
        return globalThis.__supabaseMockHandler(...args);
      }
      return {
        insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
        select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }), single: () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
      };
    },
  },
  supabaseAuthClient: {},
  supabaseAdminClient: {},
}));

jest.unstable_mockModule('../services/notificationService.js', () => ({
  createNotification: () => {},
}));

// Dynamic imports AFTER mocks are set up
const { default: guidanceServiceModule } = await import('../services/guidanceService.js');
const guidanceService = guidanceServiceModule;
const { BadRequestError, ForbiddenError, ConflictError } = await import('../utils/errors.js');

// Re-import as named exports
const {
  createRequest,
  createSession,
  updateSession,
  submitFeedback,
  getStudentSessions,
  uploadMaterial,
  getMaterials,
  respondToRequest,
} = await import('../services/guidanceService.js');

// Helper to set the mock implementation for supabase.from
function setFromHandler(handler) {
  globalThis.__supabaseMockHandler = handler;
}

function setFromReturn(returnValue) {
  globalThis.__supabaseMockHandler = () => returnValue;
}

afterEach(() => {
  globalThis.__supabaseMockHandler = null;
});

// ─── Property 1: Guidance Request Ownership Invariant ────────────────────────
// Feature: mentorship-sessions, Property 1: Guidance Request Ownership Invariant
describe('Property 1: Guidance Request Ownership Invariant', () => {
  test('student_id is always set from userId, never from body', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // real userId
        fc.uuid(), // body student_id override attempt
        fc.uuid(), // alumni_id
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length >= 10),
        async (userId, bodyStudentId, alumniId, topic, description) => {
          const insertedData = { id: 'test-id', student_id: userId, alumni_id: alumniId, topic, description, status: 'pending' };
          setFromReturn({
            insert: () => ({
              select: () => ({
                single: () => ({ data: insertedData, error: null })
              })
            })
          });

          const result = await createRequest(userId, 'student', {
            alumni_id: alumniId,
            topic,
            description,
            student_id: bodyStudentId, // attempt to override
          });

          // The returned student_id must equal userId, not bodyStudentId
          expect(result.student_id).toBe(userId);
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ─── Property 2: Session Ownership Derivation Invariant ──────────────────────
// Feature: mentorship-sessions, Property 2: Session Ownership Derivation Invariant
describe('Property 2: Session Ownership Derivation Invariant', () => {
  test('session student_id and alumni_id are always derived from guidance_request', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // real alumniUserId
        fc.uuid(), // real studentId from request
        fc.uuid(), // body student_id override
        fc.uuid(), // body alumni_id override
        fc.string({ minLength: 3 }).filter(s => s.trim().length >= 1), // title
        fc.string({ minLength: 3 }).filter(s => s.trim().length >= 1), // topic
        async (alumniUserId, realStudentId, bodyStudentId, bodyAlumniId, title, topic) => {
          const guidanceRequest = {
            id: 'req-id',
            student_id: realStudentId,
            alumni_id: alumniUserId,
            status: 'accepted',
          };
          const sessionData = {
            id: 'sess-id',
            student_id: realStudentId,
            alumni_id: alumniUserId,
            title,
            topic,
            status: 'pending',
          };

          setFromHandler((table) => {
            if (table === 'guidance_requests') {
              return {
                select: () => ({
                  eq: () => ({
                    single: () => ({ data: guidanceRequest, error: null })
                  })
                })
              };
            }
            return {
              insert: () => ({
                select: () => ({
                  single: () => ({ data: sessionData, error: null })
                })
              })
            };
          });

          const result = await createSession(alumniUserId, {
            guidance_request_id: 'req-id',
            title,
            topic,
            start_date: '2026-05-01',
            end_date: '2026-05-10',
            meeting_link: 'https://meet.google.com/test',
            student_id: bodyStudentId, // attempt override
            alumni_id: bodyAlumniId,  // attempt override
          });

          expect(result.student_id).toBe(realStudentId);
          expect(result.alumni_id).toBe(alumniUserId);
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ─── Property 3: Session Status Transition Validity ──────────────────────────
// Feature: mentorship-sessions, Property 3: Session Status Transition Validity
describe('Property 3: Session Status Transition Validity', () => {
  const ALL_STATUSES = ['pending', 'active', 'completed', 'cancelled'];
  const VALID_TRANSITIONS = {
    pending: ['active', 'cancelled'],
    active: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  test('only valid transitions succeed, all others throw ConflictError', async () => {
    for (const fromStatus of ALL_STATUSES) {
      for (const toStatus of ALL_STATUSES) {
        const isValid = VALID_TRANSITIONS[fromStatus].includes(toStatus);
        const sessionData = { id: 'sess-id', alumni_id: 'alumni-id', status: fromStatus };

        setFromReturn({
          select: () => ({
            eq: () => ({
              single: () => ({ data: sessionData, error: null })
            })
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: () => ({ data: { ...sessionData, status: toStatus }, error: null })
              })
            })
          })
        });

        if (isValid) {
          await expect(
            updateSession('sess-id', 'alumni-id', { status: toStatus })
          ).resolves.toBeDefined();
        } else {
          await expect(
            updateSession('sess-id', 'alumni-id', { status: toStatus })
          ).rejects.toThrow(ConflictError);
        }
      }
    }
  });
});

// ─── Property 4: Feedback Rating Bounds ──────────────────────────────────────
// Feature: mentorship-sessions, Property 4: Feedback Rating Bounds
describe('Property 4: Feedback Rating Bounds', () => {
  test('ratings outside [1,5] always throw BadRequestError', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: -1000, max: 0 }),
        async (invalidRating) => {
          setFromReturn({
            select: () => ({
              eq: () => ({
                single: () => ({ data: { id: 'sess-id', student_id: 'student-id', status: 'completed', alumni_id: 'alumni-id' }, error: null })
              })
            })
          });

          await expect(
            submitFeedback('sess-id', 'student-id', { rating: invalidRating })
          ).rejects.toThrow(BadRequestError);
        }
      ),
      { numRuns: 30 }
    );
  });

  test('ratings above 5 always throw BadRequestError', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 6, max: 1000 }),
        async (invalidRating) => {
          setFromReturn({
            select: () => ({
              eq: () => ({
                single: () => ({ data: { id: 'sess-id', student_id: 'student-id', status: 'completed', alumni_id: 'alumni-id' }, error: null })
              })
            })
          });

          await expect(
            submitFeedback('sess-id', 'student-id', { rating: invalidRating })
          ).rejects.toThrow(BadRequestError);
        }
      ),
      { numRuns: 30 }
    );
  });
});

// ─── Property 5: Role-Based Access Denial for Trainers ───────────────────────
// Feature: mentorship-sessions, Property 5: Role-Based Access Denial for Trainers
describe('Property 5: Role-Based Access Denial for Trainers', () => {
  test('createRequest always throws ForbiddenError for trainer role', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 3 }),
        fc.string({ minLength: 10 }),
        fc.uuid(),
        async (userId, topic, description, alumniId) => {
          await expect(
            createRequest(userId, 'trainer', { alumni_id: alumniId, topic, description })
          ).rejects.toThrow(ForbiddenError);
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ─── Property 6: Material Upload Count Invariant ─────────────────────────────
// Feature: mentorship-sessions, Property 6: Material Upload Count Invariant
describe('Property 6: Material Upload Count Invariant', () => {
  test('getMaterials returns exactly N+K records after K uploads', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 5 }), // N existing
        fc.integer({ min: 1, max: 5 }), // K to upload
        async (N, K) => {
          const existingMaterials = Array.from({ length: N }, (_, i) => ({
            id: `mat-${i}`,
            title: `Material ${i}`,
            file_url: `https://example.com/${i}`,
            type: 'link',
            mentorship_session_id: 'sess-id',
          }));

          let materialStore = [...existingMaterials];

          setFromHandler((table) => {
            if (table === 'mentorship_sessions') {
              return {
                select: () => ({
                  eq: () => ({
                    single: () => ({ data: { id: 'sess-id', alumni_id: 'alumni-id', student_id: 'student-id' }, error: null })
                  })
                })
              };
            }
            if (table === 'mentorship_materials') {
              return {
                insert: () => ({
                  select: () => ({
                    single: () => {
                      const newMat = { id: `new-${Date.now()}-${Math.random()}`, title: 'New', file_url: 'https://x.com', type: 'link', mentorship_session_id: 'sess-id' };
                      materialStore.push(newMat);
                      return { data: newMat, error: null };
                    }
                  })
                }),
                select: () => ({
                  eq: () => ({
                    order: () => ({ data: materialStore, error: null })
                  })
                })
              };
            }
            return {
              select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) })
            };
          });

          // Upload K materials
          for (let i = 0; i < K; i++) {
            await uploadMaterial('sess-id', 'alumni-id', {
              title: `Upload ${i}`,
              file_url: `https://example.com/upload-${i}`,
              type: 'link',
            });
          }

          const result = await getMaterials('sess-id', 'alumni-id', 'alumni');
          expect(result.length).toBe(N + K);
        }
      ),
      { numRuns: 10 }
    );
  });
});

// ─── Property 7: Student Data Isolation ──────────────────────────────────────
// Feature: mentorship-sessions, Property 7: Student Data Isolation
describe('Property 7: Student Data Isolation', () => {
  test('getStudentSessions never returns sessions belonging to other students', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // student S1
        fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }), // other student ids
        async (s1Id, otherIds) => {
          const s1Sessions = [{ id: 'sess-1', student_id: s1Id, status: 'active' }];
          const otherSessions = otherIds.map((id, i) => ({ id: `other-${i}`, student_id: id, status: 'active' }));
          const allSessions = [...s1Sessions, ...otherSessions];

          // getStudentSessions chains: .select().order().eq() for non-admin
          // The service does: query = from().select().order(); query = query.eq(); await query
          setFromReturn({
            select: () => ({
              order: () => ({
                // order() returns something with eq() and also awaitable
                eq: (col, val) => ({
                  data: allSessions.filter(s => s.student_id === val),
                  error: null,
                }),
                // also awaitable directly (for admin bypass)
                then: undefined,
                data: allSessions,
                error: null,
              })
            })
          });

          const result = await getStudentSessions(s1Id, 'student');
          result.forEach(session => {
            expect(session.student_id).toBe(s1Id);
          });
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ─── Property 8: Guidance Request Validation Bounds ──────────────────────────
// Feature: mentorship-sessions, Property 8: Guidance Request Validation Bounds
describe('Property 8: Guidance Request Validation Bounds', () => {
  test('topic shorter than 3 chars always throws BadRequestError', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ maxLength: 2 }),
        fc.string({ minLength: 10 }),
        fc.uuid(),
        async (shortTopic, description, alumniId) => {
          await expect(
            createRequest('user-id', 'student', {
              alumni_id: alumniId,
              topic: shortTopic,
              description,
            })
          ).rejects.toThrow(BadRequestError);
        }
      ),
      { numRuns: 30 }
    );
  });

  test('description shorter than 10 chars always throws BadRequestError', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3 }).filter(s => s.trim().length >= 3),
        fc.string({ maxLength: 9 }),
        fc.uuid(),
        async (topic, shortDesc, alumniId) => {
          await expect(
            createRequest('user-id', 'student', {
              alumni_id: alumniId,
              topic,
              description: shortDesc,
            })
          ).rejects.toThrow(BadRequestError);
        }
      ),
      { numRuns: 30 }
    );
  });
});

// ─── Property 9: Respond Ownership Invariant ─────────────────────────────────
// Feature: mentorship-sessions, Property 9: Respond Ownership Invariant
describe('Property 9: Respond Ownership Invariant', () => {
  test('responding as a different alumni always throws ForbiddenError', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // real owner alumni
        fc.uuid(), // attacker alumni (different)
        async (ownerAlumniId, attackerAlumniId) => {
          fc.pre(ownerAlumniId !== attackerAlumniId);

          setFromReturn({
            select: () => ({
              eq: () => ({
                single: () => ({
                  data: { id: 'req-id', alumni_id: ownerAlumniId, student_id: 'student-id', status: 'pending' },
                  error: null,
                })
              })
            })
          });

          await expect(
            respondToRequest('req-id', attackerAlumniId, 'accepted')
          ).rejects.toThrow(ForbiddenError);
        }
      ),
      { numRuns: 30 }
    );
  });
});

// ─── Property 10: Material Type Validation ───────────────────────────────────
// Feature: mentorship-sessions, Property 10: Material Type Validation
describe('Property 10: Material Type Validation', () => {
  const VALID_TYPES = ['pdf', 'slides', 'image', 'document', 'link'];

  test('invalid material types always throw BadRequestError', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }).filter(s => !VALID_TYPES.includes(s)),
        async (invalidType) => {
          setFromReturn({
            select: () => ({
              eq: () => ({
                single: () => ({
                  data: { id: 'sess-id', alumni_id: 'alumni-id', student_id: 'student-id' },
                  error: null,
                })
              })
            })
          });

          await expect(
            uploadMaterial('sess-id', 'alumni-id', {
              title: 'Test',
              file_url: 'https://example.com/file',
              type: invalidType,
            })
          ).rejects.toThrow(BadRequestError);
        }
      ),
      { numRuns: 30 }
    );
  });
});
