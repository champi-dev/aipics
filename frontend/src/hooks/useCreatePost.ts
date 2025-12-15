import { useState, useCallback } from "react";
import { useMutation, useApolloClient } from "@apollo/client";
import { CREATE_POST } from "../graphql/mutations";
import { GET_GENERATION_STATUS, GET_FEED } from "../graphql/queries";

interface Post {
  id: string;
  prompt: string;
  imageUrl: string;
  status: string;
  likesCount: number;
  isLikedByMe: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface CreatePostData {
  createPost: Post;
}

interface GenerationStatusData {
  generationStatus: Post;
}

export function useCreatePost() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingPost, setGeneratingPost] = useState<Post | null>(null);
  const client = useApolloClient();

  const [createPostMutation] = useMutation<CreatePostData>(CREATE_POST);

  const createPost = useCallback(
    async (prompt: string) => {
      setIsGenerating(true);

      try {
        const { data } = await createPostMutation({
          variables: { prompt },
        });

        if (!data) {
          throw new Error("Failed to create post");
        }

        const post = data.createPost;
        setGeneratingPost(post);

        // Poll for completion
        const pollInterval = setInterval(async () => {
          try {
            const { data: statusData } = await client.query<GenerationStatusData>({
              query: GET_GENERATION_STATUS,
              variables: { postId: post.id },
              fetchPolicy: "network-only",
            });

            const updatedPost = statusData.generationStatus;

            if (updatedPost.status === "COMPLETED") {
              clearInterval(pollInterval);
              setIsGenerating(false);
              setGeneratingPost(null);

              // Refetch feed to show new post
              client.refetchQueries({ include: [GET_FEED] });
            } else if (updatedPost.status === "FAILED") {
              clearInterval(pollInterval);
              setIsGenerating(false);
              setGeneratingPost(null);
            } else {
              setGeneratingPost(updatedPost);
            }
          } catch {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setGeneratingPost(null);
          }
        }, 2000);

        // Cleanup after 2 minutes max
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsGenerating(false);
        }, 120000);
      } catch (error) {
        setIsGenerating(false);
        setGeneratingPost(null);
        throw error;
      }
    },
    [createPostMutation, client]
  );

  return {
    createPost,
    isGenerating,
    generatingPost,
  };
}
