# Security Specification — LeadsArrow B2B Intelligence

## 1. Data Invariants
1. **Identity Isolation (`ownerId`)**: Every document in `/custom_leads/{leadId}` and `/saved_lists/{listId}` must have an `ownerId` strictly matching `request.auth.uid` and `request.auth.token.email_verified == true`.
2. **PII & List Query Enforcement**: Both `/custom_leads` and `/saved_lists` contain contact PII or private segmentation data. `get`, `list`, `create`, `update`, and `delete` are strictly restricted to the document owner (`resource.data.ownerId == request.auth.uid`). Blanket `isSignedIn()` reads are forbidden.
3. **Immutable Audit Fields**: `ownerId` and `createdAt` cannot be modified after creation (`incoming().ownerId == existing().ownerId && incoming().createdAt == existing().createdAt`).
4. **Server Timestamp Enforcement**: `createdAt` on `create` must equal `request.time`, and `updatedAt` on both `create` and `update` must equal `request.time`.
5. **Strict Key Allowlisting & Volumetric Bounds**: No shadow fields are permitted (`hasAll` + `hasOnly`), and every string field is bounded by its `maxLength` from `firebase-blueprint.json`.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: `auth = null`, creating `/custom_leads/lead_1` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: `auth = { uid: 'u1', token: { email_verified: false } }`, creating `/custom_leads/lead_1` -> `PERMISSION_DENIED`.
3. **Owner Spoofing on Create**: `auth.uid = 'u1'`, payload `ownerId: 'u2'` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create**: Adding `isAdmin: true` to `/custom_leads/lead_1` -> `PERMISSION_DENIED`.
5. **ID Poisoning Attack**: Document ID with invalid characters or >128 chars -> `PERMISSION_DENIED`.
6. **String Overflow (Denial of Wallet)**: `companyName` with 5,000 characters (>160 max) -> `PERMISSION_DENIED`.
7. **Invalid Enum Value**: `verificationStatus: 'HackedStatus'` -> `PERMISSION_DENIED`.
8. **Score Out of Bounds**: `buyingIntentScore: 999` (outside `0..100`) -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: `createdAt` set to past/future timestamp != `request.time` -> `PERMISSION_DENIED`.
10. **Immutable Field Mutation on Update**: Updating `ownerId` or `createdAt` on `/saved_lists/list_1` -> `PERMISSION_DENIED`.
11. **Cross-Tenant Read/List**: User `u2` attempting `get` or `list` on `u1`'s `/custom_leads` -> `PERMISSION_DENIED`.
12. **Value Poisoning on Update**: Updating `leadCount` in `/saved_lists/list_1` with a string instead of integer -> `PERMISSION_DENIED`.
