import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { IRootState } from '../../shared/reducers';
import {
  Link as RouterLink,
  LinkProps as RouterLinkProps,
  RouteComponentProps
} from 'react-router-dom';
import { speak, ITTS } from '../tts/tts';
import { completed, increaseType } from './explore.reducer';
import { assetBaseUrl } from '../../config/audio';
import ExploreInput from './explore-input';
import { playAudio } from '../audio/audio';
import './explore.scss';
import { Grid, Typography, Button } from '@material-ui/core';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginTop: theme.spacing(8),
      alignItems: 'center'
    },
    alignCenter: {
      textAlign: 'center'
    }
  })
);

const mapStateToProps = (state: IRootState) => ({
  explore: state.explore,
  currentGameCharacter: state.game.gameCharacter
});

const mapDispatchToProps = {
  completed,
  increaseType
};

type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = typeof mapDispatchToProps;

export type IProps = StateProps & DispatchProps & RouteComponentProps<{ url: string }>;

const Link1 = React.forwardRef<HTMLAnchorElement, RouterLinkProps>((props, ref) => (
  <RouterLink innerRef={ref} {...props} />
));

const Explore = props => {
  const classes = useStyles();

  const { t, i18n } = useTranslation();

  const {
    explore,
    currentGameCharacter
  } = props;

  const completedAction = props.completed;
  const increaseTypeAction = props.increaseType;

  enum KEYROW { ONE, ZERO, MINUS_ONE }

  const [timeCount, setTimeCount] = useState(0);
  const [headerText, setHeaderText] = useState(t('explore.introHeader'));
  const [introText, setIntroText] = useState(t('explore.introText'));

  const timeForExercise = 60;
  const maxInputs = 50;

  const buttonElement = useRef<HTMLAnchorElement | null>(null);
  const audioElementMusic = useRef<HTMLAudioElement | null>(null);
  const audioElementIntro: React.MutableRefObject<HTMLMediaElement | null> = useRef(null);

  const [audioElement1, audioElement2, audioElement3]: Array<React.MutableRefObject<HTMLMediaElement | null>> = [useRef(null), useRef(null), useRef(null)];
  const audioElements = [audioElement1, audioElement2, audioElement3];
  
  useEffect(() => {
    const ttsOptions: ITTS = { language: i18n.language };
    speak(headerText + ' ' + introText, ttsOptions).then(url => playAudio(audioElementIntro, url));
    // ignore lint i18n warning
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerText, introText]);

  useEffect(() => {
    let interval;

    if (timeCount > timeForExercise || explore.typeCount > maxInputs) {
      setHeaderText(t('explore.completedHeader'));
      setIntroText(t('explore.wellDone') + ' ' + currentGameCharacter.name + ' ' + t('explore.readyText')); 
      completedAction();  
    } else {
      interval = setInterval(() => setTimeCount(0), 1000);
    }

    return () => clearInterval(interval);
    // ignore lint warnings about t(...)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explore.typeCount, timeCount, completedAction, currentGameCharacter]);

  useEffect(() => {
    if (audioElementMusic && audioElementMusic.current) {
      const isPlaying = !audioElementMusic.current.paused;

      if (!isPlaying) {
        audioElementMusic.current.volume = 0.1;
        const promise = audioElementMusic.current.play();

        if (promise !== undefined) {
          promise.catch(error => console.error('Audio error', error));
        }
      }
    }
  }, [audioElementMusic]);

  useEffect(() => {
    if (audioElement1.current !== null && audioElement2.current !== null && audioElement3.current !== null) {
      audioElement1.current.load();
      audioElement2.current.load();
      audioElement3.current.load();
    }
  }, [audioElement1, audioElement2, audioElement3]);

  useEffect(() => {
    if (explore.completed && buttonElement.current !== null) {
      buttonElement.current.focus();
    }
  }, [explore.completed]);

  const getKeyRow = (key: number) => {
    if ([81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 219].some(x => x === key)) {
      return KEYROW.ONE;
    } else if ([65, 83, 68, 70, 71, 72, 74, 75, 76, 186, 222].some(x => x === key)) {
      return KEYROW.ZERO;
    } else if ([90, 88, 67, 86, 66, 78, 77, 188, 190].some(x => x === key)) {
      return KEYROW.MINUS_ONE;
    }
    return null;
  };

  const handleKey = (event: React.KeyboardEvent) => {
    increaseTypeAction();
    if (audioElements.every(element => element.current)) {
      audioElements.forEach(element => element.current!.setAttribute('currentTime', '0'));

      const keyRow: KEYROW | null = getKeyRow(event.keyCode);

      if (event.which !== 0 && !['Control', 'Meta', 'Shift', 'Alt'].some((modifier: string): boolean => event.key === modifier) && keyRow !== null) {
        const promise = audioElements[keyRow].current!.play().catch(error => console.error('play error ', error));
        if (promise === undefined) console.error(`Play ${keyRow} correct text promise undefined`);
      }
    }
  };

  return (
    <div className={classes.root}>
      <Grid container alignItems="center" justify="center" direction="column" spacing={8}>
        <Grid item xs={12}>
          <Typography variant="h1" align="center">{headerText}</Typography>
          <Typography variant="body1" align="center">{introText}</Typography>
          <audio id="intro-audio" ref={audioElementIntro} src="" />
        </Grid>
        <Grid item container xs={12} sm={3} md={3} lg={3} spacing={3} alignItems="center" justify="center">
          {!explore.completed ?
            <Grid item xs={12} className={classes.alignCenter} >
              <ExploreInput handleKey={handleKey} />
            </Grid>
            :
            <>
              <Grid item xs={12} className={classes.alignCenter}>
                <Button variant="outlined" to="/task" ref={buttonElement} component={Link1}>
                  {t('explore.next')}
                </Button>
              </Grid>
              <Grid item xs={12} className={classes.alignCenter}>
                <img
                  src={currentGameCharacter.image}
                  alt={currentGameCharacter.name}
                />
              </Grid>
            </>
          }
        </Grid>
        <audio ref={audioElementMusic} src={assetBaseUrl + '482783__mattiagiovanetti__ninja-tune.mp3'} autoPlay loop>
          Your browser does not support the audio element.
        </audio>
        <audio ref={audioElements[0]} src={assetBaseUrl + '131142__flameeagle__block.mp3'} preload="true" />
        <audio ref={audioElements[1]} src={assetBaseUrl + '471147__worldmaxter__sword-slide.mp3'} preload="true" />
        <audio ref={audioElements[2]} src={assetBaseUrl + '411462__thebuilder15__bubble-pop.mp3'} preload="true" />
      </Grid>
    </div>
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(Explore);
