import {
  SpinnerProps,
  Spinner as UIKittenSpinner,
} from "@ui-kitten/components";
import { disableAnimations } from "./launchArguments";

export default function Spinner(props: SpinnerProps) {
  return <UIKittenSpinner {...props} animating={!disableAnimations()} />;
}
