System.register("q-bundled:///fs/cocos/animation/marionette/pose-graph/motion-sync/runtime-motion-sync.js", ["../../../../../../virtual/internal%253Aconstants.js", "../../../../core/index.js"], function (_export, _context) {
  "use strict";

  var DEBUG, approx, assertIsTrue, RuntimeMotionSyncManager, Group, RuntimeMotionSyncRecordImpl;
  _export("RuntimeMotionSyncManager", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      DEBUG = _virtualInternal253AconstantsJs.DEBUG;
    }, function (_coreIndexJs) {
      approx = _coreIndexJs.approx;
      assertIsTrue = _coreIndexJs.assertIsTrue;
    }],
    execute: function () {
      _export("RuntimeMotionSyncManager", RuntimeMotionSyncManager = class RuntimeMotionSyncManager {
        constructor() {
          this._groups = [];
        }
        register(syncInfo) {
          const {
            group: groupName
          } = syncInfo;
          let group = this._groups.find(group => group.name === groupName);
          if (!group) {
            group = new Group(groupName);
            this._groups.push(group);
          }
          return group.addMember();
        }
        sync() {
          for (const group of this._groups) {
            group.sync();
          }
        }
      });
      Group = class Group {
        constructor(name) {
          this._lastLeader = undefined;
          this._records = [];
          this.name = name;
        }
        addMember() {
          const record = new RuntimeMotionSyncRecordImpl();
          this._records.push(record);
          return record;
        }
        sync() {
          const {
            _records: records
          } = this;
          const nRecords = records.length;
          assertIsTrue(nRecords > 0);
          const {
            _lastLeader: lastLeader
          } = this;
          this._lastLeader = undefined;

          // Do nothing if all of records are inactive.
          if (records.every(r => !r.active)) {
            return;
          }

          // Sort records so that higher weighted records are in front,
          // inactive records are treated having weight -1.
          records.sort((a, b) => {
            const kA = a.active ? a.weight : -1.0;
            const kB = b.active ? b.weight : -1.0;
            return kB - kA;
          });

          // Assertion: inactive records are in tail.
          if (DEBUG) {
            const firstInactiveRecord = records.findIndex(r => !r.active);
            assertIsTrue((firstInactiveRecord < 0 ? [] : records.slice(firstInactiveRecord)).every(r => !r.active));
          }

          // Here's an optimization:
          // if two or more records have almost same weight. Their order is indeterminate.
          // To avoid this, we prefer the leader during previous sync.
          let leaderIndex = 0;
          const leaderWeight = records[0].weight;
          // If the first record is just the last leader, everyone is happy, nothing to do.
          if (records[leaderIndex] !== lastLeader) {
            for (let iRecord = 0; iRecord < nRecords; ++iRecord) {
              const record = records[iRecord];
              if (!record.active || !approx(record.weight, leaderWeight, 1e-6)) {
                break;
              }
              if (record === lastLeader) {
                leaderIndex = iRecord;
                break;
              }
            }
          }

          // Assertion: the first record is active. It becomes the leader.
          assertIsTrue(records[leaderIndex].active);
          this._lastLeader = records[leaderIndex];

          // Sync followers to follow the leader.
          const leaderNormalizedTime = records[leaderIndex].normalizedTime;
          for (let iRecord = 0; iRecord < nRecords; ++iRecord) {
            const record = records[iRecord];
            if (!record.active) {
              break;
            }
            record.normalizedTime = leaderNormalizedTime;
            record.reset();
          }
        }
      };
      RuntimeMotionSyncRecordImpl = class RuntimeMotionSyncRecordImpl {
        constructor() {
          this.normalizedTime = 0.0;
          this.weight = 0.0;
          this.active = false;
        }
        notifyRenter(normalizedTime) {
          this.reset();
          this.normalizedTime = normalizedTime;
        }
        notifyUpdate(normalizedDeltaTime, weight) {
          this.normalizedTime += normalizedDeltaTime;
          // Note: we're allowing update multiple times. The first update becomes "activate".
          if (this.active) {
            this.weight += weight;
          } else {
            this.active = true;
            this.weight = weight;
          }
        }
        reset() {
          this.active = false;
          this.weight = 0.0;
        }
        getSyncedEnterTime() {
          return this.normalizedTime;
        }
      };
    }
  };
});