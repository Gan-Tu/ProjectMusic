import AppContainer from "../../components/AppContainer";
import { useRouter } from "next/router";
import { ArrowLeftIcon } from "@heroicons/react/solid";

export default function ArtistProfile() {
  const router = useRouter();
  // const { name } = router.query;
  return (
    <AppContainer title={"Nick Breton - Profile"}>
      <div className="uppercase p-8 bg-neutral-800 text-white flex text-center font-semibold text-sm transparent-selection cursor-pointer place-content-between">
        <div className="flex space-x-10">
          <div className="text-pmred mr-5 flex items-center">
            <div className="flex cursor-pointer items-center p-2 mr-4">
              <ArrowLeftIcon className="h-4" />
            </div>
            Back
          </div>
          <div className="flex space-x-8 border-l-2 border-neutral-500 pl-10 items-center">
            <p className="text-neutral-500">Profile</p>
            <p>Inbox</p>
            <p>Credits</p>
            <p>VIP</p>
          </div>
        </div>
        <div className="items-center space-x-14 px-8 hidden lg:inline-flex">
          <div className="flex flex-col border-r-2 pr-14 border-neutral-500 ">
            <div className="text-2xl">13K</div>
            <div>Friends</div>
          </div>
          <div className="flex flex-col border-r-2 pr-14 border-neutral-500 ">
            <div className="text-2xl">6,9K</div>
            <div>Followers</div>
          </div>
          <div className="flex flex-col text-pmred">
            <div className="text-2xl">3740</div>
            <div>Credits</div>
          </div>
        </div>
      </div>
    </AppContainer>
  );
}
