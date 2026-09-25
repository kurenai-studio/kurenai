System.register("q-bundled:///fs/cocos/physics/physx/physx-enum.js", [], function (_export, _context) {
  "use strict";

  var EFilterDataWord3, PxHitFlag, PxQueryFlag, PxPairFlag, PxContactPairFlag, PxTriggerPairFlag;
  return {
    setters: [],
    execute: function () {
      /*
       Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com/
      
       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated documentation files (the "Software"), to deal
       in the Software without restriction, including without limitation the rights to
       use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
       of the Software, and to permit persons to whom the Software is furnished to do so,
       subject to the following conditions:
      
       The above copyright notice and this permission notice shall be included in
       all copies or substantial portions of the Software.
      
       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
       IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
       FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
       AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
       LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
       THE SOFTWARE.
      */
      /* eslint-disable max-len */
      /* eslint-disable no-tabs */
      /// enum ///
      _export("EFilterDataWord3", EFilterDataWord3 = /*#__PURE__*/function (EFilterDataWord3) {
        EFilterDataWord3[EFilterDataWord3["QUERY_FILTER"] = 1] = "QUERY_FILTER";
        EFilterDataWord3[EFilterDataWord3["QUERY_CHECK_TRIGGER"] = 2] = "QUERY_CHECK_TRIGGER";
        EFilterDataWord3[EFilterDataWord3["QUERY_SINGLE_HIT"] = 4] = "QUERY_SINGLE_HIT";
        EFilterDataWord3[EFilterDataWord3["DETECT_TRIGGER_EVENT"] = 8] = "DETECT_TRIGGER_EVENT";
        EFilterDataWord3[EFilterDataWord3["DETECT_CONTACT_EVENT"] = 16] = "DETECT_CONTACT_EVENT";
        EFilterDataWord3[EFilterDataWord3["DETECT_CONTACT_POINT"] = 32] = "DETECT_CONTACT_POINT";
        EFilterDataWord3[EFilterDataWord3["DETECT_CONTACT_CCD"] = 64] = "DETECT_CONTACT_CCD";
        return EFilterDataWord3;
      }({}));
      _export("PxHitFlag", PxHitFlag = function (PxHitFlag) {
        PxHitFlag[PxHitFlag["ePOSITION"] = 1] = "ePOSITION";
        //! < "position" member of #PxQueryHit is valid
        PxHitFlag[PxHitFlag["eNORMAL"] = 2] = "eNORMAL";
        //! < "normal" member of #PxQueryHit is valid
        PxHitFlag[PxHitFlag["eUV"] = 8] = "eUV";
        //! < "u" and "v" barycentric coordinates of #PxQueryHit are valid. Not applicable to sweep queries.
        PxHitFlag[PxHitFlag["eASSUME_NO_INITIAL_OVERLAP"] = 16] = "eASSUME_NO_INITIAL_OVERLAP";
        //! < Performance hint flag for sweeps when it is known upfront there's no initial overlap.
        //! < NOTE: using this flag may cause undefined results if shapes are initially overlapping.
        PxHitFlag[PxHitFlag["eMESH_MULTIPLE"] = 32] = "eMESH_MULTIPLE";
        //! < Report all hits for meshes rather than just the first. Not applicable to sweep queries.
        PxHitFlag[PxHitFlag["eMESH_ANY"] = 64] = "eMESH_ANY";
        //! < Report any first hit for meshes. If neither eMESH_MULTIPLE nor eMESH_ANY is specified,
        //! < a single closest hit will be reported for meshes.
        PxHitFlag[PxHitFlag["eMESH_BOTH_SIDES"] = 128] = "eMESH_BOTH_SIDES";
        //! < Report hits with back faces of mesh triangles. Also report hits for raycast
        //! < originating on mesh surface and facing away from the surface normal. Not applicable to sweep queries.
        //! < Please refer to the user guide for heightfield-specific differences.
        PxHitFlag[PxHitFlag["ePRECISE_SWEEP"] = 256] = "ePRECISE_SWEEP";
        //! < Use more accurate but slower narrow phase sweep tests.
        //! < May provide better compatibility with PhysX 3.2 sweep behavior.
        PxHitFlag[PxHitFlag["eMTD"] = 512] = "eMTD";
        //! < Report the minimum translation depth, normal and contact point.
        PxHitFlag[PxHitFlag["eFACE_INDEX"] = 1024] = "eFACE_INDEX";
        //! < "face index" member of #PxQueryHit is valid
        PxHitFlag[PxHitFlag["eDEFAULT"] = PxHitFlag.ePOSITION | PxHitFlag.eNORMAL | PxHitFlag.eFACE_INDEX] = "eDEFAULT";
        /** \brief Only this subset of flags can be modified by pre-filter. Other modifications will be discarded. */
        PxHitFlag[PxHitFlag["eMODIFIABLE_FLAGS"] = PxHitFlag.eMESH_MULTIPLE | PxHitFlag.eMESH_BOTH_SIDES | PxHitFlag.eASSUME_NO_INITIAL_OVERLAP | PxHitFlag.ePRECISE_SWEEP] = "eMODIFIABLE_FLAGS";
        return PxHitFlag;
      }({}));
      _export("PxQueryFlag", PxQueryFlag = /*#__PURE__*/function (PxQueryFlag) {
        PxQueryFlag[PxQueryFlag["eSTATIC"] = 1] = "eSTATIC";
        //! < Traverse static shapes
        PxQueryFlag[PxQueryFlag["eDYNAMIC"] = 2] = "eDYNAMIC";
        //! < Traverse dynamic shapes
        PxQueryFlag[PxQueryFlag["ePREFILTER"] = 4] = "ePREFILTER";
        //! < Run the pre-intersection-test filter (see #PxQueryFilterCallback::preFilter())
        PxQueryFlag[PxQueryFlag["ePOSTFILTER"] = 8] = "ePOSTFILTER";
        //! < Run the post-intersection-test filter (see #PxQueryFilterCallback::postFilter())
        PxQueryFlag[PxQueryFlag["eANY_HIT"] = 16] = "eANY_HIT";
        //! < Abort traversal as soon as any hit is found and return it via callback.block.
        //! < Helps query performance. Both eTOUCH and eBLOCK hitTypes are considered hits with this flag.
        PxQueryFlag[PxQueryFlag["eNO_BLOCK"] = 32] = "eNO_BLOCK";
        //! < All hits are reported as touching. Overrides eBLOCK returned from user filters with eTOUCH.
        //! < This is also an optimization hint that may improve query performance.
        PxQueryFlag[PxQueryFlag["eRESERVED"] = 32768] = "eRESERVED"; //! < Reserved for internal use
        return PxQueryFlag;
      }({}));
      _export("PxPairFlag", PxPairFlag = /*#__PURE__*/function (PxPairFlag) {
        /**
        \brief Process the contacts of this collision pair in the dynamics solver.
         \note Only takes effect if the colliding actors are rigid bodies.
        */
        PxPairFlag[PxPairFlag["eSOLVE_CONTACT"] = 1] = "eSOLVE_CONTACT";
        /**
        \brief Call contact modification callback for this collision pair
         \note Only takes effect if the colliding actors are rigid bodies.
         @see PxContactModifyCallback
        */
        PxPairFlag[PxPairFlag["eMODIFY_CONTACTS"] = 2] = "eMODIFY_CONTACTS";
        /**
        \brief Call contact report callback or trigger callback when this collision pair starts to be in contact.
         If one of the two collision objects is a trigger shape (see #PxShapeFlag::eTRIGGER_SHAPE)
        then the trigger callback will get called as soon as the other object enters the trigger volume.
        If none of the two collision objects is a trigger shape then the contact report callback will get
        called when the actors of this collision pair start to be in contact.
         \note Only takes effect if the colliding actors are rigid bodies.
         \note Only takes effect if eDETECT_DISCRETE_CONTACT or eDETECT_CCD_CONTACT is raised
         @see PxSimulationEventCallback.onContact() PxSimulationEventCallback.onTrigger()
        */
        PxPairFlag[PxPairFlag["eNOTIFY_TOUCH_FOUND"] = 4] = "eNOTIFY_TOUCH_FOUND";
        /**
        \brief Call contact report callback while this collision pair is in contact
         If none of the two collision objects is a trigger shape then the contact report callback will get
        called while the actors of this collision pair are in contact.
         \note Triggers do not support this event. Persistent trigger contacts need to be tracked separately by observing eNOTIFY_TOUCH_FOUND/eNOTIFY_TOUCH_LOST events.
         \note Only takes effect if the colliding actors are rigid bodies.
         \note No report will get sent if the objects in contact are sleeping.
         \note Only takes effect if eDETECT_DISCRETE_CONTACT or eDETECT_CCD_CONTACT is raised
         \note If this flag gets enabled while a pair is in touch already, there will be no eNOTIFY_TOUCH_PERSISTS events until the pair loses and regains touch.
         @see PxSimulationEventCallback.onContact() PxSimulationEventCallback.onTrigger()
        */
        PxPairFlag[PxPairFlag["eNOTIFY_TOUCH_PERSISTS"] = 8] = "eNOTIFY_TOUCH_PERSISTS";
        /**
        \brief Call contact report callback or trigger callback when this collision pair stops to be in contact
         If one of the two collision objects is a trigger shape (see #PxShapeFlag::eTRIGGER_SHAPE)
        then the trigger callback will get called as soon as the other object leaves the trigger volume.
        If none of the two collision objects is a trigger shape then the contact report callback will get
        called when the actors of this collision pair stop to be in contact.
         \note Only takes effect if the colliding actors are rigid bodies.
         \note This event will also get triggered if one of the colliding objects gets deleted.
         \note Only takes effect if eDETECT_DISCRETE_CONTACT or eDETECT_CCD_CONTACT is raised
         @see PxSimulationEventCallback.onContact() PxSimulationEventCallback.onTrigger()
        */
        PxPairFlag[PxPairFlag["eNOTIFY_TOUCH_LOST"] = 16] = "eNOTIFY_TOUCH_LOST";
        /**
        \brief Call contact report callback when this collision pair is in contact during CCD passes.
         If CCD with multiple passes is enabled, then a fast moving object might bounce on and off the same
        object multiple times. Hence, the same pair might be in contact multiple times during a simulation step.
        This flag will make sure that all the detected collision during CCD will get reported. For performance
        reasons, the system can not always tell whether the contact pair lost touch in one of the previous CCD
        passes and thus can also not always tell whether the contact is new or has persisted. eNOTIFY_TOUCH_CCD
        just reports when the two collision objects were detected as being in contact during a CCD pass.
         \note Only takes effect if the colliding actors are rigid bodies.
         \note Trigger shapes are not supported.
         \note Only takes effect if eDETECT_CCD_CONTACT is raised
         @see PxSimulationEventCallback.onContact() PxSimulationEventCallback.onTrigger()
        */
        PxPairFlag[PxPairFlag["eNOTIFY_TOUCH_CCD"] = 32] = "eNOTIFY_TOUCH_CCD";
        /**
        \brief Call contact report callback when the contact force between the actors of this collision pair exceeds one of the actor-defined force thresholds.
         \note Only takes effect if the colliding actors are rigid bodies.
         \note Only takes effect if eDETECT_DISCRETE_CONTACT or eDETECT_CCD_CONTACT is raised
         @see PxSimulationEventCallback.onContact()
        */
        PxPairFlag[PxPairFlag["eNOTIFY_THRESHOLD_FORCE_FOUND"] = 64] = "eNOTIFY_THRESHOLD_FORCE_FOUND";
        /**
        \brief Call contact report callback when the contact force between the actors of this collision pair continues to exceed one of the actor-defined force thresholds.
         \note Only takes effect if the colliding actors are rigid bodies.
         \note If a pair gets re-filtered and this flag has previously been disabled, then the report will not get fired in the same frame even if the force threshold has been reached in the
        previous one (unless #eNOTIFY_THRESHOLD_FORCE_FOUND has been set in the previous frame).
         \note Only takes effect if eDETECT_DISCRETE_CONTACT or eDETECT_CCD_CONTACT is raised
         @see PxSimulationEventCallback.onContact()
        */
        PxPairFlag[PxPairFlag["eNOTIFY_THRESHOLD_FORCE_PERSISTS"] = 128] = "eNOTIFY_THRESHOLD_FORCE_PERSISTS";
        /**
        \brief Call contact report callback when the contact force between the actors of this collision pair falls below one of the actor-defined force thresholds (includes the case where this collision pair stops being in contact).
         \note Only takes effect if the colliding actors are rigid bodies.
         \note If a pair gets re-filtered and this flag has previously been disabled, then the report will not get fired in the same frame even if the force threshold has been reached in the
        previous one (unless #eNOTIFY_THRESHOLD_FORCE_FOUND or #eNOTIFY_THRESHOLD_FORCE_PERSISTS has been set in the previous frame).
         \note Only takes effect if eDETECT_DISCRETE_CONTACT or eDETECT_CCD_CONTACT is raised
         @see PxSimulationEventCallback.onContact()
        */
        PxPairFlag[PxPairFlag["eNOTIFY_THRESHOLD_FORCE_LOST"] = 256] = "eNOTIFY_THRESHOLD_FORCE_LOST";
        /**
        \brief Provide contact points in contact reports for this collision pair.
         \note Only takes effect if the colliding actors are rigid bodies and if used in combination with the flags eNOTIFY_TOUCH_... or eNOTIFY_THRESHOLD_FORCE_...
         \note Only takes effect if eDETECT_DISCRETE_CONTACT or eDETECT_CCD_CONTACT is raised
         @see PxSimulationEventCallback.onContact() PxContactPair PxContactPair.extractContacts()
        */
        PxPairFlag[PxPairFlag["eNOTIFY_CONTACT_POINTS"] = 512] = "eNOTIFY_CONTACT_POINTS";
        /**
        \brief This flag is used to indicate whether this pair generates discrete collision detection contacts.
         \note Contacts are only responded to if eSOLVE_CONTACT is enabled.
        */
        PxPairFlag[PxPairFlag["eDETECT_DISCRETE_CONTACT"] = 1024] = "eDETECT_DISCRETE_CONTACT";
        /**
        \brief This flag is used to indicate whether this pair generates CCD contacts.
         \note The contacts will only be responded to if eSOLVE_CONTACT is enabled on this pair.
        \note The scene must have PxSceneFlag::eENABLE_CCD enabled to use this feature.
        \note Non-static bodies of the pair should have PxRigidBodyFlag::eENABLE_CCD specified for this feature to work correctly.
        \note This flag is not supported with trigger shapes. However, CCD trigger events can be emulated using non-trigger shapes
        and requesting eNOTIFY_TOUCH_FOUND and eNOTIFY_TOUCH_LOST and not raising eSOLVE_CONTACT on the pair.
         @see PxRigidBodyFlag::eENABLE_CCD
        @see PxSceneFlag::eENABLE_CCD
        */
        PxPairFlag[PxPairFlag["eDETECT_CCD_CONTACT"] = 2048] = "eDETECT_CCD_CONTACT";
        /**
        \brief Provide pre solver velocities in contact reports for this collision pair.
         If the collision pair has contact reports enabled, the velocities of the rigid bodies before contacts have been solved
        will be provided in the contact report callback unless the pair lost touch in which case no data will be provided.
         \note Usually it is not necessary to request these velocities as they will be available by querying the velocity from the provided
        PxRigidActor object directly. However, it might be the case that the velocity of a rigid body gets set while the simulation is running
        in which case the PxRigidActor would return this new velocity in the contact report callback and not the velocity the simulation used.
         @see PxSimulationEventCallback.onContact(), PxContactPairVelocity, PxContactPairHeader.extraDataStream
        */
        PxPairFlag[PxPairFlag["ePRE_SOLVER_VELOCITY"] = 4096] = "ePRE_SOLVER_VELOCITY";
        /**
        \brief Provide post solver velocities in contact reports for this collision pair.
         If the collision pair has contact reports enabled, the velocities of the rigid bodies after contacts have been solved
        will be provided in the contact report callback unless the pair lost touch in which case no data will be provided.
         @see PxSimulationEventCallback.onContact(), PxContactPairVelocity, PxContactPairHeader.extraDataStream
        */
        PxPairFlag[PxPairFlag["ePOST_SOLVER_VELOCITY"] = 8192] = "ePOST_SOLVER_VELOCITY";
        /**
        \brief Provide rigid body poses in contact reports for this collision pair.
         If the collision pair has contact reports enabled, the rigid body poses at the contact event will be provided
        in the contact report callback unless the pair lost touch in which case no data will be provided.
         \note Usually it is not necessary to request these poses as they will be available by querying the pose from the provided
        PxRigidActor object directly. However, it might be the case that the pose of a rigid body gets set while the simulation is running
        in which case the PxRigidActor would return this new pose in the contact report callback and not the pose the simulation used.
        Another use case is related to CCD with multiple passes enabled, A fast moving object might bounce on and off the same
        object multiple times. This flag can be used to request the rigid body poses at the time of impact for each such collision event.
         @see PxSimulationEventCallback.onContact(), PxContactPairPose, PxContactPairHeader.extraDataStream
        */
        PxPairFlag[PxPairFlag["eCONTACT_EVENT_POSE"] = 16384] = "eCONTACT_EVENT_POSE";
        PxPairFlag[PxPairFlag["eNEXT_FREE"] = 32768] = "eNEXT_FREE";
        //! < For internal use only.
        /**
        \brief Provided default flag to do simple contact processing for this collision pair.
        */
        PxPairFlag[PxPairFlag["eCONTACT_DEFAULT"] = 1025] = "eCONTACT_DEFAULT";
        /**
        \brief Provided default flag to get commonly used trigger behavior for this collision pair.
        */
        PxPairFlag[PxPairFlag["eTRIGGER_DEFAULT"] = 1044] = "eTRIGGER_DEFAULT";
        return PxPairFlag;
      }({}));
      _export("PxContactPairFlag", PxContactPairFlag = /*#__PURE__*/function (PxContactPairFlag) {
        /**
        \brief The shape with index 0 has been removed from the actor/scene.
        */
        PxContactPairFlag[PxContactPairFlag["eREMOVED_SHAPE_0"] = 1] = "eREMOVED_SHAPE_0";
        /**
        \brief The shape with index 1 has been removed from the actor/scene.
        */
        PxContactPairFlag[PxContactPairFlag["eREMOVED_SHAPE_1"] = 2] = "eREMOVED_SHAPE_1";
        /**
        \brief First actor pair contact.
         The provided shape pair marks the first contact between the two actors, no other shape pair has been touching prior to the current simulation frame.
         \note: This info is only available if #PxPairFlag::eNOTIFY_TOUCH_FOUND has been declared for the pair.
        */
        PxContactPairFlag[PxContactPairFlag["eACTOR_PAIR_HAS_FIRST_TOUCH"] = 4] = "eACTOR_PAIR_HAS_FIRST_TOUCH";
        /**
        \brief All contact between the actor pair was lost.
         All contact between the two actors has been lost, no shape pairs remain touching after the current simulation frame.
        */
        PxContactPairFlag[PxContactPairFlag["eACTOR_PAIR_LOST_TOUCH"] = 8] = "eACTOR_PAIR_LOST_TOUCH";
        /**
        \brief Internal flag, used by #PxContactPair.extractContacts()
         The applied contact impulses are provided for every contact point.
        This is the case if #PxPairFlag::eSOLVE_CONTACT has been set for the pair.
        */
        PxContactPairFlag[PxContactPairFlag["eINTERNAL_HAS_IMPULSES"] = 16] = "eINTERNAL_HAS_IMPULSES";
        /**
        \brief Internal flag, used by #PxContactPair.extractContacts()
         The provided contact point information is flipped with regards to the shapes of the contact pair. This mainly concerns the order of the internal triangle indices.
        */
        PxContactPairFlag[PxContactPairFlag["eINTERNAL_CONTACTS_ARE_FLIPPED"] = 32] = "eINTERNAL_CONTACTS_ARE_FLIPPED";
        return PxContactPairFlag;
      }({}));
      _export("PxTriggerPairFlag", PxTriggerPairFlag = /*#__PURE__*/function (PxTriggerPairFlag) {
        PxTriggerPairFlag[PxTriggerPairFlag["eREMOVED_SHAPE_TRIGGER"] = 1] = "eREMOVED_SHAPE_TRIGGER";
        //! < The trigger shape has been removed from the actor/scene.
        PxTriggerPairFlag[PxTriggerPairFlag["eREMOVED_SHAPE_OTHER"] = 2] = "eREMOVED_SHAPE_OTHER";
        //! < The shape causing the trigger event has been removed from the actor/scene.
        PxTriggerPairFlag[PxTriggerPairFlag["eNEXT_FREE"] = 4] = "eNEXT_FREE"; //! < For internal use only.
        return PxTriggerPairFlag;
      }({}));
    }
  };
});