// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-underscore-dangle */
import Messenger from 'app/Messenger';
import TextToSpeechFeature from 'app/awspack/TextToSpeechFeature';
import Speech from 'app/awspack/Speech';
import describeEnvironment from '../EnvironmentHarness';

describeEnvironment('TextToSpeechFeature', (options, env) => {
  let mockHost;
  const mockNeuralVersion = '2.503.0';

  beforeEach(async () => {
    mockHost = new Messenger();

    // mock AWS.Polly
    const mockPolly = jasmine.createSpyObj('Polly', ['describeVoices']);
    mockPolly.describeVoices.and.returnValue({
      promise: jasmine.createSpy().and.returnValue(
        Promise.resolve({
          Voices: [
            {
              Gender: 'Female',
              Id: 'Emma',
              LanguageCode: 'en-US',
              LanguageName: 'US English',
              Name: 'Emma',
              SupportedEngines: ['standard'],
            },
            {
              Gender: 'Male',
              Id: 'Brian',
              LanguageCode: 'en-GB',
              LanguageName: 'British English',
              Name: 'Brian',
              SupportedEngines: ['standard', 'neural'],
            },
            {
              Gender: 'Female',
              Id: 'Amy',
              LanguageCode: 'en-GB',
              LanguageName: 'British English',
              Name: 'Amy',
              SupportedEngines: ['standard'],
            },
          ],
        })
      ),
    });

    // mock AWS.Polly.Presigner
    const mockPresigner = jasmine.createSpyObj('Presigner', [
      'getSynthesizeSpeechUrl',
    ]);
    mockPresigner.getSynthesizeSpeechUrl.and.callFake((_params, fn) => {
      fn(undefined, '/base/test/assets/audio.mp3');
    });

    await TextToSpeechFeature.initializeService(
      mockPolly,
      mockPresigner,
      mockNeuralVersion
    );
  });

  describe('_createSpeech', () => {
    it('should return an object that extends Speech', async () => {
      const tts = new TextToSpeechFeature(mockHost);
      const speech = tts._createSpeech('', [], {
        audio: {
          onended: jasmine.createSpy('onended'),
          onEndedObservable: {add: jasmine.createSpy('add')},
        },
      });

      expect(speech).toBeInstanceOf(Speech);
    });
  });

  describe('_synthesizeAudio', () => {
    function itActsLikeBabylonSynthesizeAudio() {
      it("should return a promise that resolves to an object with an audio property that's and instance of BABYLON.Sound", async () => {
        const {scene} = options;
        const tts = new TextToSpeechFeature(mockHost, {scene});
        const promise = tts._synthesizeAudio({});

        const result = await promise;

        expect(result).toBeInstanceOf(Object);
        expect(result.audio).toBeDefined();
        expect(result.audio).toBeInstanceOf(BABYLON.Sound);
      });

      it("should define the result audio's spatialSound property to be false if attachTo is not defined in the constructor options", async () => {
        const {scene} = options;
        const tts = new TextToSpeechFeature(mockHost, {scene});
        const promise = tts._synthesizeAudio({});

        const {audio} = await promise;

        expect(audio.spatialSound).toBeFalse();
      });

      it("should define the result audio's spatialSound property to be true if attachTo is defined in the constructor options", async () => {
        const {scene} = options;
        const attachTo = new BABYLON.TransformNode('attach', scene);
        const tts = new TextToSpeechFeature(mockHost, {scene, attachTo});
        const promise = tts._synthesizeAudio({});

        const {audio} = await promise;

        expect(audio.spatialSound).toBeTrue();
      });
    }

    itActsLikeBabylonSynthesizeAudio();
  });
});