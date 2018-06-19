import React, { Component } from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  InteractionManager,
} from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import ActionButton from 'react-native-action-button';
import OverlaySpinner from 'react-native-loading-spinner-overlay';
import NovelCommentReplies from '../../containers/NovelCommentReplies';
import enhancePostComment from '../../components/HOC/enhancePostComment';
import CommentList from '../../components/CommentList';
import ViewMoreButton from '../../components/ViewMoreButton';
import * as novelCommentsActionCreators from '../../common/actions/novelComments';
import { makeGetNovelCommentsItems } from '../../common/selectors';
import { globalStyles } from '../../styles';
import { SCREENS } from '../../common/constants';

const styles = StyleSheet.create({
  viewMoreButtonContainer: {
    marginTop: 10,
  },
  textInput: {
    flex: 1,
    margin: 10,
  },
});

class NovelComments extends Component {
  componentDidMount() {
    const {
      fetchNovelComments,
      clearNovelComments,
      novelComments,
      novelId,
    } = this.props;
    if (!novelComments || !novelComments.items) {
      clearNovelComments(novelId);
      InteractionManager.runAfterInteractions(() => {
        fetchNovelComments(novelId);
      });
    }
  }

  loadMoreItems = () => {
    const { fetchNovelComments, novelComments, novelId } = this.props;
    if (novelComments && !novelComments.loading && novelComments.nextUrl) {
      fetchNovelComments(novelId, null, novelComments.nextUrl);
    }
  };

  handleOnRefresh = () => {
    const { fetchNovelComments, clearNovelComments, novelId } = this.props;
    clearNovelComments(novelId);
    fetchNovelComments(novelId, null, null, true);
  };

  handleOnPressViewMoreComments = () => {
    const { novelId, authorId, navigation: { push } } = this.props;
    push(SCREENS.NovelComments, {
      novelId,
      authorId,
    });
  };

  handleOnPressCommentButton = () => {
    const { checkIfUserEligibleToPostComment } = this.props;
    const isEligible = checkIfUserEligibleToPostComment();
    if (isEligible) {
      const { novelId, navigation: { navigate } } = this.props;
      navigate(SCREENS.AddNovelComment, {
        novelId,
        onSubmitComment: this.handleOnSubmitComment,
      });
    }
  };

  handleOnPressReplyCommentButton = commentItem => {
    const { checkIfUserEligibleToPostComment } = this.props;
    const isEligible = checkIfUserEligibleToPostComment();
    if (isEligible) {
      const { novelId, authorId, navigation: { navigate } } = this.props;
      navigate(SCREENS.ReplyNovelComment, {
        novelId,
        authorId,
        commentItem,
        onSubmitComment: this.handleOnSubmitComment,
      });
    }
  };

  handleOnSubmitComment = () => {
    const { novelId, fetchNovelComments, clearNovelComments } = this.props;
    clearNovelComments(novelId);
    fetchNovelComments(novelId);
  };

  renderCommentReplies = commentId => {
    const { authorId, navigation } = this.props;
    return (
      <NovelCommentReplies
        commentId={commentId}
        authorId={authorId}
        navigation={navigation}
      />
    );
  };

  render() {
    const {
      authorId,
      novelComments,
      items,
      verificationEmail,
      user,
      navigation,
      isFeatureInDetailPage,
      maxItems,
    } = this.props;
    return (
      <SafeAreaView style={globalStyles.container}>
        <CommentList
          authorId={authorId}
          data={{ ...novelComments, items }}
          loadMoreItems={!isFeatureInDetailPage ? this.loadMoreItems : null}
          onRefresh={!isFeatureInDetailPage ? this.handleOnRefresh : null}
          maxItems={isFeatureInDetailPage && maxItems}
          navigation={navigation}
          user={user}
          renderCommentReplies={this.renderCommentReplies}
          onPressReplyCommentButton={this.handleOnPressReplyCommentButton}
        />
        {isFeatureInDetailPage &&
          <View style={styles.viewMoreButtonContainer}>
            <ViewMoreButton onPress={this.handleOnPressViewMoreComments} />
          </View>}
        {!isFeatureInDetailPage &&
          <ActionButton
            buttonColor="#fff"
            icon={<Icon name="pencil" size={24} color="#737373" />}
            onPress={this.handleOnPressCommentButton}
            fixNativeFeedbackRadius
          />}
        <OverlaySpinner visible={verificationEmail.loading} />
      </SafeAreaView>
    );
  }
}

export default enhancePostComment(
  connect(() => {
    const getNovelCommentsItems = makeGetNovelCommentsItems();
    return (state, props) => {
      const { novelComments } = state;
      const novelId = props.novelId || props.navigation.state.params.novelId;
      const authorId = props.authorId || props.navigation.state.params.authorId;
      return {
        novelComments: novelComments[novelId],
        items: getNovelCommentsItems(state, props),
        novelId,
        authorId,
      };
    };
  }, novelCommentsActionCreators)(NovelComments),
);
